import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import { Post } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { beforeAll, describe, expect, test } from "vitest";

import { HandleResolver } from "../../infrastructure/handle-resolver.js";
import { PostRepository } from "../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../../infrastructure/profile-repository.js";
import { RecordRepository } from "../../infrastructure/record-repository.js";
import { EmbedViewService } from "./embed-view-service.js";
import { PostViewService } from "./post-view-service.js";
import { ProfileViewService } from "./profile-view-service.js";
import { ReplyRefService } from "./reply-ref-service.js";

let replyRefService: ReplyRefService;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  replyRefService = testSetup.testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("handleResolver", HandleResolver)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("embedViewService", EmbedViewService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("postViewService", PostViewService)
    .injectClass(ReplyRefService);
  ctx = testSetup.ctx;
});

describe("ReplyRefService", () => {
  test("リプライがない投稿のみの場合、空のMapを返す", async () => {
    // arrange
    const posts = [
      new Post({
        uri: new AtUri("at://user1/app.bsky.feed.post/1"),
        cid: "cid1",
        actorDid: "did:plc:user1",
        text: "Normal post",
        replyRoot: null,
        replyParent: null,
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.createReplyRefs(posts);

    // assert
    expect(result).toEqual(new Map());
  });

  test("リプライがある場合、reply情報を含むMapを返す", async () => {
    // arrange
    const rootUri = new AtUri("at://did:plc:user1/app.bsky.feed.post/root");
    const parentUri = new AtUri("at://did:plc:user1/app.bsky.feed.post/parent");
    const replyUri = new AtUri("at://did:plc:user2/app.bsky.feed.post/reply");

    // actorを作成
    await ctx.db.insert(schema.actors).values([
      { did: "did:plc:user1", handle: "user1.test" },
      { did: "did:plc:user2", handle: "user2.test" },
    ]);

    // 根投稿を作成
    await ctx.db.insert(schema.records).values({
      uri: rootUri.toString(),
      cid: "root-cid",
      actorDid: "did:plc:user1",
      json: { text: "Root post" },
    });
    await ctx.db.insert(schema.posts).values({
      uri: rootUri.toString(),
      cid: "root-cid",
      actorDid: "did:plc:user1",
      text: "Root post",
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
    });

    // 親投稿を作成
    await ctx.db.insert(schema.records).values({
      uri: parentUri.toString(),
      cid: "parent-cid",
      actorDid: "did:plc:user1",
      json: { text: "Parent post" },
    });
    await ctx.db.insert(schema.posts).values({
      uri: parentUri.toString(),
      cid: "parent-cid",
      actorDid: "did:plc:user1",
      text: "Parent post",
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
    });

    // プロフィールを作成
    const profileUri = `at://did:plc:user1/app.bsky.actor.profile/self`;
    await ctx.db.insert(schema.records).values({
      uri: profileUri,
      cid: "profile-cid",
      actorDid: "did:plc:user1",
      json: {
        $type: "app.bsky.actor.profile",
        displayName: "User 1",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    });
    await ctx.db.insert(schema.profiles).values({
      uri: profileUri,
      cid: "profile-cid",
      actorDid: "did:plc:user1",
      displayName: "User 1",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    const posts = [
      new Post({
        uri: replyUri,
        cid: "reply-cid",
        actorDid: "did:plc:user2",
        text: "Reply post",
        replyRoot: { uri: rootUri, cid: "root-cid" },
        replyParent: { uri: parentUri, cid: "parent-cid" },
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.createReplyRefs(posts);

    // assert
    expect(result.size).toBe(1);
    expect(result.has(replyUri.toString())).toBe(true);

    const replyRef = result.get(replyUri.toString());
    expect(replyRef).toMatchObject({
      $type: "app.bsky.feed.defs#replyRef",
      root: {
        uri: rootUri.toString(),
      },
      parent: {
        uri: parentUri.toString(),
      },
    });
  });

  test("複数のリプライがある場合、すべてのreply情報を含むMapを返す", async () => {
    // arrange
    const rootUri = new AtUri("at://did:plc:user3/app.bsky.feed.post/root");
    const parentUri = new AtUri("at://did:plc:user3/app.bsky.feed.post/parent");
    const reply1Uri = new AtUri("at://did:plc:user4/app.bsky.feed.post/reply1");
    const reply2Uri = new AtUri("at://did:plc:user5/app.bsky.feed.post/reply2");

    // actorを作成
    await ctx.db.insert(schema.actors).values([
      { did: "did:plc:user3", handle: "user3.test" },
      { did: "did:plc:user4", handle: "user4.test" },
      { did: "did:plc:user5", handle: "user5.test" },
    ]);

    // 根投稿を作成
    await ctx.db.insert(schema.records).values({
      uri: rootUri.toString(),
      cid: "root-cid-2",
      actorDid: "did:plc:user3",
      json: { text: "Root post 2" },
    });
    await ctx.db.insert(schema.posts).values({
      uri: rootUri.toString(),
      cid: "root-cid-2",
      actorDid: "did:plc:user3",
      text: "Root post 2",
      createdAt: new Date("2024-01-02T01:00:00.000Z"),
    });

    // 親投稿を作成
    await ctx.db.insert(schema.records).values({
      uri: parentUri.toString(),
      cid: "parent-cid-2",
      actorDid: "did:plc:user3",
      json: { text: "Parent post 2" },
    });
    await ctx.db.insert(schema.posts).values({
      uri: parentUri.toString(),
      cid: "parent-cid-2",
      actorDid: "did:plc:user3",
      text: "Parent post 2",
      createdAt: new Date("2024-01-02T02:00:00.000Z"),
    });

    // プロフィールを作成
    const profileUri = `at://did:plc:user3/app.bsky.actor.profile/self`;
    await ctx.db.insert(schema.records).values({
      uri: profileUri,
      cid: "profile-cid-2",
      actorDid: "did:plc:user3",
      json: {
        $type: "app.bsky.actor.profile",
        displayName: "User 3",
        createdAt: "2024-01-02T00:00:00.000Z",
      },
    });
    await ctx.db.insert(schema.profiles).values({
      uri: profileUri,
      cid: "profile-cid-2",
      actorDid: "did:plc:user3",
      displayName: "User 3",
      createdAt: new Date("2024-01-02T00:00:00.000Z"),
    });

    const posts = [
      new Post({
        uri: reply1Uri,
        cid: "reply1-cid",
        actorDid: "did:plc:user4",
        text: "Reply 1",
        replyRoot: { uri: rootUri, cid: "root-cid-2" },
        replyParent: { uri: parentUri, cid: "parent-cid-2" },
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
      new Post({
        uri: reply2Uri,
        cid: "reply2-cid",
        actorDid: "did:plc:user5",
        text: "Reply 2",
        replyRoot: { uri: rootUri, cid: "root-cid-2" },
        replyParent: { uri: rootUri, cid: "root-cid-2" }, // 同じrootへの直接リプライ
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.createReplyRefs(posts);

    // assert
    expect(result.size).toBe(2);
    expect(result.has(reply1Uri.toString())).toBe(true);
    expect(result.has(reply2Uri.toString())).toBe(true);
  });

  test("PostViewが見つからない場合、NotFoundPostを含むreply情報を返す", async () => {
    // arrange
    const rootUri = new AtUri("at://did:plc:notfound/app.bsky.feed.post/root");
    const parentUri = new AtUri(
      "at://did:plc:notfound/app.bsky.feed.post/parent",
    );
    const replyUri = new AtUri("at://did:plc:user6/app.bsky.feed.post/reply");

    const posts = [
      new Post({
        uri: replyUri,
        cid: "reply-cid",
        actorDid: "did:plc:user6",
        text: "Reply post",
        replyRoot: { uri: rootUri, cid: "root-cid" },
        replyParent: { uri: parentUri, cid: "parent-cid" },
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.createReplyRefs(posts);

    // assert
    expect(result.size).toBe(1);

    const replyRef = result.get(replyUri.toString());
    expect(replyRef).toMatchObject({
      $type: "app.bsky.feed.defs#replyRef",
      root: {
        $type: "app.bsky.feed.defs#notFoundPost",
        uri: rootUri.toString(),
        notFound: true,
      },
      parent: {
        $type: "app.bsky.feed.defs#notFoundPost",
        uri: parentUri.toString(),
        notFound: true,
      },
    });
  });

  test("リプライとノーマル投稿が混在している場合、リプライのみを処理する", async () => {
    // arrange
    const rootUri = new AtUri("at://did:plc:user7/app.bsky.feed.post/root");
    const parentUri = new AtUri("at://did:plc:user7/app.bsky.feed.post/parent");
    const replyUri = new AtUri("at://did:plc:user8/app.bsky.feed.post/reply");
    const normalUri = new AtUri("at://did:plc:user9/app.bsky.feed.post/normal");

    // actorを作成
    await ctx.db.insert(schema.actors).values([
      { did: "did:plc:user7", handle: "user7.test" },
      { did: "did:plc:user8", handle: "user8.test" },
      { did: "did:plc:user9", handle: "user9.test" },
    ]);

    // 根投稿を作成
    await ctx.db.insert(schema.records).values({
      uri: rootUri.toString(),
      cid: "root-cid-3",
      actorDid: "did:plc:user7",
      json: { text: "Root post 3" },
    });
    await ctx.db.insert(schema.posts).values({
      uri: rootUri.toString(),
      cid: "root-cid-3",
      actorDid: "did:plc:user7",
      text: "Root post 3",
      createdAt: new Date("2024-01-03T01:00:00.000Z"),
    });

    // 親投稿を作成
    await ctx.db.insert(schema.records).values({
      uri: parentUri.toString(),
      cid: "parent-cid-3",
      actorDid: "did:plc:user7",
      json: { text: "Parent post 3" },
    });
    await ctx.db.insert(schema.posts).values({
      uri: parentUri.toString(),
      cid: "parent-cid-3",
      actorDid: "did:plc:user7",
      text: "Parent post 3",
      createdAt: new Date("2024-01-03T02:00:00.000Z"),
    });

    // プロフィールを作成
    const profileUri = `at://did:plc:user7/app.bsky.actor.profile/self`;
    await ctx.db.insert(schema.records).values({
      uri: profileUri,
      cid: "profile-cid-3",
      actorDid: "did:plc:user7",
      json: {
        $type: "app.bsky.actor.profile",
        displayName: "User 7",
        createdAt: "2024-01-03T00:00:00.000Z",
      },
    });
    await ctx.db.insert(schema.profiles).values({
      uri: profileUri,
      cid: "profile-cid-3",
      actorDid: "did:plc:user7",
      displayName: "User 7",
      createdAt: new Date("2024-01-03T00:00:00.000Z"),
    });

    const posts = [
      new Post({
        uri: normalUri,
        cid: "normal-cid",
        actorDid: "did:plc:user9",
        text: "Normal post",
        replyRoot: null,
        replyParent: null,
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
      new Post({
        uri: replyUri,
        cid: "reply-cid",
        actorDid: "did:plc:user8",
        text: "Reply post",
        replyRoot: { uri: rootUri, cid: "root-cid-3" },
        replyParent: { uri: parentUri, cid: "parent-cid-3" },
        langs: null,
        embed: null,
        createdAt: new Date(),
        sortAt: null,
        indexedAt: new Date(),
      }),
    ];

    // act
    const result = await replyRefService.createReplyRefs(posts);

    // assert
    expect(result.size).toBe(1);
    expect(result.has(replyUri.toString())).toBe(true);
    expect(result.has(normalUri.toString())).toBe(false);
  });
});
