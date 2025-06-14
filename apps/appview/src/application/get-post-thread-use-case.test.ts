import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { beforeAll, describe, expect, test } from "vitest";

import { HandlesToDidsRepository } from "../infrastructure/handles-to-dids-repository.js";
import { PostRepository } from "../infrastructure/post-repository.js";
import { ProfileRepository } from "../infrastructure/profile-repository.js";
import { RecordRepository } from "../infrastructure/record-repository.js";
import { GetPostThreadUseCase } from "./get-post-thread-use-case.js";
import { EmbedViewService } from "./service/embed-view-service.js";
import { PostViewService } from "./service/post-view-service.js";
import { ProfileViewService } from "./service/profile-view-service.js";

let getPostThreadUseCase: GetPostThreadUseCase;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  getPostThreadUseCase = testSetup.testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("handlesToDidsRepository", HandlesToDidsRepository)
    .provideClass("postRepository", PostRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("embedViewService", EmbedViewService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("postViewService", PostViewService)
    .injectClass(GetPostThreadUseCase);
  ctx = testSetup.ctx;
});

describe("GetPostThreadUseCase", () => {
  test("投稿が見つからない場合はnotFoundPostを返す", async () => {
    // act
    const result = await getPostThreadUseCase.execute({
      uri: "at://did:plc:notexist/app.bsky.feed.post/notexist",
      depth: 6,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toEqual({
      $type: "app.bsky.feed.defs#notFoundPost",
      uri: "at://did:plc:notexist/app.bsky.feed.post/notexist",
      notFound: true,
    });
  });

  test("親投稿も子投稿もない単一投稿の場合、parentとrepliesが空のThreadViewPostを返す", async () => {
    // arrange
    const postUri = AtUri.make(
      "did:plc:single",
      "app.bsky.feed.post",
      "single123",
    );
    const actorDid = "did:plc:single";
    const postRecord = {
      $type: "app.bsky.feed.post",
      text: "Single post",
      createdAt: "2024-01-01T00:00:00.000Z",
    };

    await ctx.db.insert(schema.actors).values({
      did: actorDid,
      handle: "single.bsky.social",
    });

    await ctx.db.insert(schema.records).values({
      uri: postUri.toString(),
      cid: "bafyreisingle",
      actorDid,
      json: postRecord,
      indexedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    await ctx.db.insert(schema.posts).values({
      uri: postUri.toString(),
      cid: "bafyreisingle",
      actorDid,
      text: "Single post",
      createdAt: new Date(postRecord.createdAt),
    });

    const profileUri = `at://${actorDid}/app.bsky.actor.profile/self`;
    await ctx.db.insert(schema.records).values({
      uri: profileUri,
      cid: "bafyreiprofile",
      actorDid,
      json: {
        $type: "app.bsky.actor.profile",
        displayName: "Single User",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      indexedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    await ctx.db.insert(schema.profiles).values({
      uri: profileUri,
      cid: "bafyreiprofile",
      actorDid,
      displayName: "Single User",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    // act
    const result = await getPostThreadUseCase.execute({
      uri: postUri.toString(),
      depth: 6,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: postUri.toString(),
        author: {
          displayName: "Single User",
        },
      },
      parent: undefined,
      replies: [],
    });
  });

  test("リプライ投稿の場合、親投稿の階層構造をparentに含むThreadViewPostを返す", async () => {
    // arrange
    const rootUri = AtUri.make("did:plc:root", "app.bsky.feed.post", "root123");
    const parentUri = AtUri.make(
      "did:plc:parent",
      "app.bsky.feed.post",
      "parent123",
    );
    const targetUri = AtUri.make(
      "did:plc:target",
      "app.bsky.feed.post",
      "target123",
    );

    const rootActorDid = "did:plc:root";
    const parentActorDid = "did:plc:parent";
    const targetActorDid = "did:plc:target";

    // actorsを作成
    await ctx.db.insert(schema.actors).values([
      { did: rootActorDid, handle: "root.bsky.social" },
      { did: parentActorDid, handle: "parent.bsky.social" },
      { did: targetActorDid, handle: "target.bsky.social" },
    ]);

    // recordsを作成
    await ctx.db.insert(schema.records).values([
      {
        uri: rootUri.toString(),
        cid: "bafyreiroot",
        actorDid: rootActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Root post",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: parentUri.toString(),
        cid: "bafyreiparent",
        actorDid: parentActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Parent post",
          reply: {
            root: { uri: rootUri.toString(), cid: "bafyreiroot" },
            parent: { uri: rootUri.toString(), cid: "bafyreiroot" },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T01:00:00.000Z"),
      },
      {
        uri: targetUri.toString(),
        cid: "bafyreitarget",
        actorDid: targetActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Target post",
          reply: {
            root: { uri: rootUri.toString(), cid: "bafyreiroot" },
            parent: { uri: parentUri.toString(), cid: "bafyreiparent" },
          },
          createdAt: "2024-01-01T02:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T02:00:00.000Z"),
      },
    ]);

    // profile recordsを作成
    await ctx.db.insert(schema.records).values([
      {
        uri: `at://${rootActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofileroot",
        actorDid: rootActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Root User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${parentActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofileparent",
        actorDid: parentActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Parent User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${targetActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofiletarget",
        actorDid: targetActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Target User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ]);

    // postsを作成
    await ctx.db.insert(schema.posts).values([
      {
        uri: rootUri.toString(),
        cid: "bafyreiroot",
        actorDid: rootActorDid,
        text: "Root post",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: parentUri.toString(),
        cid: "bafyreiparent",
        actorDid: parentActorDid,
        text: "Parent post",
        replyRootUri: rootUri.toString(),
        replyRootCid: "bafyreiroot",
        replyParentUri: rootUri.toString(),
        replyParentCid: "bafyreiroot",
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
      },
      {
        uri: targetUri.toString(),
        cid: "bafyreitarget",
        actorDid: targetActorDid,
        text: "Target post",
        replyRootUri: rootUri.toString(),
        replyRootCid: "bafyreiroot",
        replyParentUri: parentUri.toString(),
        replyParentCid: "bafyreiparent",
        createdAt: new Date("2024-01-01T02:00:00.000Z"),
      },
    ]);

    // profilesを作成
    await ctx.db.insert(schema.profiles).values([
      {
        uri: `at://${rootActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofileroot",
        actorDid: rootActorDid,
        displayName: "Root User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${parentActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofileparent",
        actorDid: parentActorDid,
        displayName: "Parent User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${targetActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofiletarget",
        actorDid: targetActorDid,
        displayName: "Target User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ]);

    // act
    const result = await getPostThreadUseCase.execute({
      uri: targetUri.toString(),
      depth: 6,
      parentHeight: 10,
    });

    // assert
    expect(result.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: targetUri.toString(),
        author: {
          displayName: "Target User",
        },
      },
      parent: {
        $type: "app.bsky.feed.defs#threadViewPost",
        post: {
          uri: parentUri.toString(),
          author: {
            displayName: "Parent User",
          },
        },
        parent: {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: rootUri.toString(),
            author: {
              displayName: "Root User",
            },
          },
        },
      },
    });
  });

  test("子投稿がある投稿の場合、子投稿の階層構造をrepliesに含むThreadViewPostを返す", async () => {
    // arrange
    const rootUri = AtUri.make(
      "did:plc:rootuser",
      "app.bsky.feed.post",
      "root456",
    );
    const replyUri = AtUri.make(
      "did:plc:replyuser",
      "app.bsky.feed.post",
      "reply456",
    );
    const grandchildUri = AtUri.make(
      "did:plc:grandchilduser",
      "app.bsky.feed.post",
      "grandchild456",
    );

    const rootActorDid = "did:plc:rootuser";
    const replyActorDid = "did:plc:replyuser";
    const grandchildActorDid = "did:plc:grandchilduser";

    // actorsを作成
    await ctx.db.insert(schema.actors).values([
      { did: rootActorDid, handle: "root.bsky.social" },
      { did: replyActorDid, handle: "reply.bsky.social" },
      { did: grandchildActorDid, handle: "grandchild.bsky.social" },
    ]);

    // recordsを作成
    await ctx.db.insert(schema.records).values([
      {
        uri: rootUri.toString(),
        cid: "bafyreiroot456",
        actorDid: rootActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Root post with replies",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: replyUri.toString(),
        cid: "bafyreireply456",
        actorDid: replyActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Reply to root post",
          reply: {
            root: { uri: rootUri.toString(), cid: "bafyreiroot456" },
            parent: { uri: rootUri.toString(), cid: "bafyreiroot456" },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T01:00:00.000Z"),
      },
      {
        uri: grandchildUri.toString(),
        cid: "bafyreigrandchild456",
        actorDid: grandchildActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Reply to reply post",
          reply: {
            root: { uri: rootUri.toString(), cid: "bafyreiroot456" },
            parent: { uri: replyUri.toString(), cid: "bafyreireply456" },
          },
          createdAt: "2024-01-01T02:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T02:00:00.000Z"),
      },
    ]);

    // postsを作成
    await ctx.db.insert(schema.posts).values([
      {
        uri: rootUri.toString(),
        cid: "bafyreiroot456",
        actorDid: rootActorDid,
        text: "Root post with replies",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: replyUri.toString(),
        cid: "bafyreireply456",
        actorDid: replyActorDid,
        text: "Reply to root post",
        replyRootUri: rootUri.toString(),
        replyRootCid: "bafyreiroot456",
        replyParentUri: rootUri.toString(),
        replyParentCid: "bafyreiroot456",
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
      },
      {
        uri: grandchildUri.toString(),
        cid: "bafyreigrandchild456",
        actorDid: grandchildActorDid,
        text: "Reply to reply post",
        replyRootUri: rootUri.toString(),
        replyRootCid: "bafyreiroot456",
        replyParentUri: replyUri.toString(),
        replyParentCid: "bafyreireply456",
        createdAt: new Date("2024-01-01T02:00:00.000Z"),
      },
    ]);

    // profile recordsを作成
    await ctx.db.insert(schema.records).values([
      {
        uri: `at://${rootActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofileroot456",
        actorDid: rootActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Root User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${replyActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilereply456",
        actorDid: replyActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Reply User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${grandchildActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilegrandchild456",
        actorDid: grandchildActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Grandchild User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ]);

    // profilesを作成
    await ctx.db.insert(schema.profiles).values([
      {
        uri: `at://${rootActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofileroot456",
        actorDid: rootActorDid,
        displayName: "Root User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${replyActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilereply456",
        actorDid: replyActorDid,
        displayName: "Reply User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${grandchildActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilegrandchild456",
        actorDid: grandchildActorDid,
        displayName: "Grandchild User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ]);

    // act
    const result = await getPostThreadUseCase.execute({
      uri: rootUri.toString(),
      depth: 6,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: rootUri.toString(),
        author: {
          displayName: "Root User",
        },
      },
      parent: undefined,
      replies: [
        {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: replyUri.toString(),
            author: {
              displayName: "Reply User",
            },
          },
          replies: [
            {
              $type: "app.bsky.feed.defs#threadViewPost",
              post: {
                uri: grandchildUri.toString(),
                author: {
                  displayName: "Grandchild User",
                },
              },
            },
          ],
        },
      ],
    });
  });
});
