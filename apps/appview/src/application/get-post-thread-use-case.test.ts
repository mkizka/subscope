import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  postFactory,
  profileFactory,
  setupTestDatabase,
} from "@repo/test-utils";
import { beforeAll, describe, expect, test, vi } from "vitest";

import { HandleResolver } from "../infrastructure/handle-resolver.js";
import { PostRepository } from "../infrastructure/post-repository.js";
import { PostStatsRepository } from "../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../infrastructure/profile-repository.js";
import { RecordRepository } from "../infrastructure/record-repository.js";
import { GetPostThreadUseCase } from "./get-post-thread-use-case.js";
import { AtUriService } from "./service/at-uri-service.js";
import { EmbedViewService } from "./service/embed-view-service.js";
import { PostViewService } from "./service/post-view-service.js";
import { ProfileViewService } from "./service/profile-view-service.js";

let getPostThreadUseCase: GetPostThreadUseCase;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

const spyFindByUri = vi.spyOn(PostRepository.prototype, "findByUri");
const spyFindPostView = vi.spyOn(PostViewService.prototype, "findPostView");
const spyFindReplies = vi.spyOn(PostRepository.prototype, "findReplies");

beforeAll(() => {
  const testSetup = getSetup();
  getPostThreadUseCase = testSetup.testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("handleResolver", HandleResolver)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("embedViewService", EmbedViewService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("postViewService", PostViewService)
    .provideClass("atUriService", AtUriService)
    .injectClass(GetPostThreadUseCase);
  ctx = testSetup.ctx;
});

describe("GetPostThreadUseCase", () => {
  test("投稿が見つからない場合はnotFoundPostを返す", async () => {
    // act
    const result = await getPostThreadUseCase.execute({
      uri: new AtUri("at://did:plc:notexist/app.bsky.feed.post/notexist"),
      depth: 6,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toEqual({
      $type: "app.bsky.feed.defs#notFoundPost",
      uri: "at://did:plc:notexist/app.bsky.feed.post/notexist",
      notFound: true,
    });
    // ターゲット投稿の取得1回のみ
    expect(spyFindByUri).toHaveBeenCalledTimes(1);
    expect(spyFindReplies).toHaveBeenCalledTimes(0);
    expect(spyFindPostView).toHaveBeenCalledTimes(0);
  });

  test("親投稿も子投稿もない単一投稿の場合、parentとrepliesが空のThreadViewPostを返す", async () => {
    // arrange
    const post = await postFactory(ctx.db).create();
    const profile = await profileFactory(ctx.db)
      .props({ actorDid: () => post.actorDid })
      .create();

    // act
    const result = await getPostThreadUseCase.execute({
      uri: new AtUri(post.uri),
      depth: 6,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: post.uri,
        author: {
          displayName: profile.displayName,
        },
      },
      parent: undefined,
      replies: [],
    });
    // ターゲット投稿とリプライ取得1回ずつ
    expect(spyFindByUri).toHaveBeenCalledTimes(1);
    expect(spyFindReplies).toHaveBeenCalledTimes(1);
    expect(spyFindPostView).toHaveBeenCalledTimes(1);
  });

  test("リプライ投稿の場合、親投稿の階層構造をparentに含むThreadViewPostを返す", async () => {
    // arrange
    const rootPost = await postFactory(ctx.db).create();
    const rootProfile = await profileFactory(ctx.db)
      .props({
        actorDid: () => rootPost.actorDid,
      })
      .create();
    const parentPost = await postFactory(ctx.db)
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => rootPost.uri,
        replyParentCid: () => rootPost.cid,
      })
      .create();
    const parentProfile = await profileFactory(ctx.db)
      .props({
        actorDid: () => parentPost.actorDid,
      })
      .create();
    const targetPost = await postFactory(ctx.db)
      .props({
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => parentPost.uri,
        replyParentCid: () => parentPost.cid,
      })
      .create();
    const targetProfile = await profileFactory(ctx.db)
      .props({
        actorDid: () => targetPost.actorDid,
      })
      .create();

    // act
    const result = await getPostThreadUseCase.execute({
      uri: new AtUri(targetPost.uri),
      depth: 6,
      parentHeight: 10,
    });

    // assert
    expect(result.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: targetPost.uri,
        author: {
          displayName: targetProfile.displayName,
        },
      },
      parent: {
        $type: "app.bsky.feed.defs#threadViewPost",
        post: {
          uri: parentPost.uri,
          author: {
            displayName: parentProfile.displayName,
          },
        },
        parent: {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: rootPost.uri,
            author: {
              displayName: rootProfile.displayName,
            },
          },
        },
      },
    });
    // ターゲット投稿1回、親2回取得
    expect(spyFindByUri).toHaveBeenCalledTimes(3);
    // ターゲット投稿のリプライを検索
    expect(spyFindReplies).toHaveBeenCalledTimes(1);
    expect(spyFindPostView).toHaveBeenCalledTimes(1);
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
      uri: rootUri,
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
    // ターゲット投稿の取得1回のみ
    expect(spyFindByUri).toHaveBeenCalledTimes(1);
    // ターゲット投稿のリプライ、リプライのリプライ、リプライのリプライのリプライ(これは結果無し)で3回
    expect(spyFindReplies).toHaveBeenCalledTimes(3);
    expect(spyFindPostView).toHaveBeenCalledTimes(1);
  });

  test("depthより大きい深さのリプライは取得しない", async () => {
    // arrange
    const rootUri = AtUri.make(
      "did:plc:depthtest",
      "app.bsky.feed.post",
      "root789",
    );
    const level1Uri = AtUri.make(
      "did:plc:level1",
      "app.bsky.feed.post",
      "level1789",
    );
    const level2Uri = AtUri.make(
      "did:plc:level2",
      "app.bsky.feed.post",
      "level2789",
    );
    const level3Uri = AtUri.make(
      "did:plc:level3",
      "app.bsky.feed.post",
      "level3789",
    );

    const rootActorDid = "did:plc:depthtest";
    const level1ActorDid = "did:plc:level1";
    const level2ActorDid = "did:plc:level2";
    const level3ActorDid = "did:plc:level3";

    // actorsを作成
    await ctx.db.insert(schema.actors).values([
      { did: rootActorDid, handle: "root.bsky.social" },
      { did: level1ActorDid, handle: "level1.bsky.social" },
      { did: level2ActorDid, handle: "level2.bsky.social" },
      { did: level3ActorDid, handle: "level3.bsky.social" },
    ]);

    // recordsを作成
    await ctx.db.insert(schema.records).values([
      {
        uri: rootUri.toString(),
        cid: "bafyreiroot789",
        actorDid: rootActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Root post for depth test",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: level1Uri.toString(),
        cid: "bafyreilevel1789",
        actorDid: level1ActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Level 1 reply",
          reply: {
            root: { uri: rootUri.toString(), cid: "bafyreiroot789" },
            parent: { uri: rootUri.toString(), cid: "bafyreiroot789" },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T01:00:00.000Z"),
      },
      {
        uri: level2Uri.toString(),
        cid: "bafyreilevel2789",
        actorDid: level2ActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Level 2 reply",
          reply: {
            root: { uri: rootUri.toString(), cid: "bafyreiroot789" },
            parent: { uri: level1Uri.toString(), cid: "bafyreilevel1789" },
          },
          createdAt: "2024-01-01T02:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T02:00:00.000Z"),
      },
      {
        uri: level3Uri.toString(),
        cid: "bafyreilevel3789",
        actorDid: level3ActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Level 3 reply (should not appear)",
          reply: {
            root: { uri: rootUri.toString(), cid: "bafyreiroot789" },
            parent: { uri: level2Uri.toString(), cid: "bafyreilevel2789" },
          },
          createdAt: "2024-01-01T03:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T03:00:00.000Z"),
      },
    ]);

    // postsを作成
    await ctx.db.insert(schema.posts).values([
      {
        uri: rootUri.toString(),
        cid: "bafyreiroot789",
        actorDid: rootActorDid,
        text: "Root post for depth test",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: level1Uri.toString(),
        cid: "bafyreilevel1789",
        actorDid: level1ActorDid,
        text: "Level 1 reply",
        replyRootUri: rootUri.toString(),
        replyRootCid: "bafyreiroot789",
        replyParentUri: rootUri.toString(),
        replyParentCid: "bafyreiroot789",
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
      },
      {
        uri: level2Uri.toString(),
        cid: "bafyreilevel2789",
        actorDid: level2ActorDid,
        text: "Level 2 reply",
        replyRootUri: rootUri.toString(),
        replyRootCid: "bafyreiroot789",
        replyParentUri: level1Uri.toString(),
        replyParentCid: "bafyreilevel1789",
        createdAt: new Date("2024-01-01T02:00:00.000Z"),
      },
      {
        uri: level3Uri.toString(),
        cid: "bafyreilevel3789",
        actorDid: level3ActorDid,
        text: "Level 3 reply (should not appear)",
        replyRootUri: rootUri.toString(),
        replyRootCid: "bafyreiroot789",
        replyParentUri: level2Uri.toString(),
        replyParentCid: "bafyreilevel2789",
        createdAt: new Date("2024-01-01T03:00:00.000Z"),
      },
    ]);

    // profile recordsを作成
    await ctx.db.insert(schema.records).values([
      {
        uri: `at://${rootActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofileroot789",
        actorDid: rootActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Root User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${level1ActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilelevel1789",
        actorDid: level1ActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Level 1 User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${level2ActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilelevel2789",
        actorDid: level2ActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Level 2 User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${level3ActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilelevel3789",
        actorDid: level3ActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Level 3 User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ]);

    // profilesを作成
    await ctx.db.insert(schema.profiles).values([
      {
        uri: `at://${rootActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofileroot789",
        actorDid: rootActorDid,
        displayName: "Root User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${level1ActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilelevel1789",
        actorDid: level1ActorDid,
        displayName: "Level 1 User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${level2ActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilelevel2789",
        actorDid: level2ActorDid,
        displayName: "Level 2 User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${level3ActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilelevel3789",
        actorDid: level3ActorDid,
        displayName: "Level 3 User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ]);

    // act - depth=2で実行（Level 3は取得されないはず）
    const result = await getPostThreadUseCase.execute({
      uri: rootUri,
      depth: 2,
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
            uri: level1Uri.toString(),
            author: {
              displayName: "Level 1 User",
            },
          },
          replies: [
            {
              $type: "app.bsky.feed.defs#threadViewPost",
              post: {
                uri: level2Uri.toString(),
                author: {
                  displayName: "Level 2 User",
                },
              },
              replies: [], // Level 3はdepth=2の制限により含まれない
            },
          ],
        },
      ],
    });
    // ターゲット投稿の取得で1回
    expect(spyFindByUri).toHaveBeenCalledTimes(1);
    // depth=2の制限により、ルート投稿と深さ1の投稿のリプライのみ取得（計2回）
    expect(spyFindReplies).toHaveBeenCalledTimes(2);
    expect(spyFindPostView).toHaveBeenCalledTimes(1);
  });

  test("parentHeightより大きい高さの親投稿は取得しない", async () => {
    // arrange
    const level0Uri = AtUri.make(
      "did:plc:level0",
      "app.bsky.feed.post",
      "level0abc",
    );
    const level1Uri = AtUri.make(
      "did:plc:level1parent",
      "app.bsky.feed.post",
      "level1abc",
    );
    const level2Uri = AtUri.make(
      "did:plc:level2parent",
      "app.bsky.feed.post",
      "level2abc",
    );
    const targetUri = AtUri.make(
      "did:plc:targetparent",
      "app.bsky.feed.post",
      "targetabc",
    );

    const level0ActorDid = "did:plc:level0";
    const level1ActorDid = "did:plc:level1parent";
    const level2ActorDid = "did:plc:level2parent";
    const targetActorDid = "did:plc:targetparent";

    // actorsを作成
    await ctx.db.insert(schema.actors).values([
      { did: level0ActorDid, handle: "level0.bsky.social" },
      { did: level1ActorDid, handle: "level1.bsky.social" },
      { did: level2ActorDid, handle: "level2.bsky.social" },
      { did: targetActorDid, handle: "targetparent.bsky.social" },
    ]);

    // recordsを作成
    await ctx.db.insert(schema.records).values([
      {
        uri: level0Uri.toString(),
        cid: "bafyreilevel0abc",
        actorDid: level0ActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Level 0 root post (should not appear)",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: level1Uri.toString(),
        cid: "bafyreilevel1abc",
        actorDid: level1ActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Level 1 parent post",
          reply: {
            root: { uri: level0Uri.toString(), cid: "bafyreilevel0abc" },
            parent: { uri: level0Uri.toString(), cid: "bafyreilevel0abc" },
          },
          createdAt: "2024-01-01T01:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T01:00:00.000Z"),
      },
      {
        uri: level2Uri.toString(),
        cid: "bafyreilevel2abc",
        actorDid: level2ActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Level 2 parent post",
          reply: {
            root: { uri: level0Uri.toString(), cid: "bafyreilevel0abc" },
            parent: { uri: level1Uri.toString(), cid: "bafyreilevel1abc" },
          },
          createdAt: "2024-01-01T02:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T02:00:00.000Z"),
      },
      {
        uri: targetUri.toString(),
        cid: "bafyreitargetabc",
        actorDid: targetActorDid,
        json: {
          $type: "app.bsky.feed.post",
          text: "Target post",
          reply: {
            root: { uri: level0Uri.toString(), cid: "bafyreilevel0abc" },
            parent: { uri: level2Uri.toString(), cid: "bafyreilevel2abc" },
          },
          createdAt: "2024-01-01T03:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T03:00:00.000Z"),
      },
    ]);

    // postsを作成
    await ctx.db.insert(schema.posts).values([
      {
        uri: level0Uri.toString(),
        cid: "bafyreilevel0abc",
        actorDid: level0ActorDid,
        text: "Level 0 root post (should not appear)",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: level1Uri.toString(),
        cid: "bafyreilevel1abc",
        actorDid: level1ActorDid,
        text: "Level 1 parent post",
        replyRootUri: level0Uri.toString(),
        replyRootCid: "bafyreilevel0abc",
        replyParentUri: level0Uri.toString(),
        replyParentCid: "bafyreilevel0abc",
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
      },
      {
        uri: level2Uri.toString(),
        cid: "bafyreilevel2abc",
        actorDid: level2ActorDid,
        text: "Level 2 parent post",
        replyRootUri: level0Uri.toString(),
        replyRootCid: "bafyreilevel0abc",
        replyParentUri: level1Uri.toString(),
        replyParentCid: "bafyreilevel1abc",
        createdAt: new Date("2024-01-01T02:00:00.000Z"),
      },
      {
        uri: targetUri.toString(),
        cid: "bafyreitargetabc",
        actorDid: targetActorDid,
        text: "Target post",
        replyRootUri: level0Uri.toString(),
        replyRootCid: "bafyreilevel0abc",
        replyParentUri: level2Uri.toString(),
        replyParentCid: "bafyreilevel2abc",
        createdAt: new Date("2024-01-01T03:00:00.000Z"),
      },
    ]);

    // profile recordsを作成
    await ctx.db.insert(schema.records).values([
      {
        uri: `at://${level0ActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilelevel0abc",
        actorDid: level0ActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Level 0 User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${level1ActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilelevel1abc",
        actorDid: level1ActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Level 1 User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${level2ActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilelevel2abc",
        actorDid: level2ActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Level 2 User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${targetActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofiletargetabc",
        actorDid: targetActorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Target User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        indexedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ]);

    // profilesを作成
    await ctx.db.insert(schema.profiles).values([
      {
        uri: `at://${level0ActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilelevel0abc",
        actorDid: level0ActorDid,
        displayName: "Level 0 User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${level1ActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilelevel1abc",
        actorDid: level1ActorDid,
        displayName: "Level 1 User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${level2ActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofilelevel2abc",
        actorDid: level2ActorDid,
        displayName: "Level 2 User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        uri: `at://${targetActorDid}/app.bsky.actor.profile/self`,
        cid: "bafyreiprofiletargetabc",
        actorDid: targetActorDid,
        displayName: "Target User",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ]);

    // act - parentHeight=2で実行（Level 0は取得されないはず）
    const result = await getPostThreadUseCase.execute({
      uri: targetUri,
      depth: 6,
      parentHeight: 2,
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
          uri: level2Uri.toString(),
          author: {
            displayName: "Level 2 User",
          },
        },
        parent: {
          $type: "app.bsky.feed.defs#threadViewPost",
          post: {
            uri: level1Uri.toString(),
            author: {
              displayName: "Level 1 User",
            },
          },
          parent: undefined, // Level 0はparentHeight=2の制限により含まれない
        },
      },
      replies: [],
    });
    // ターゲット投稿で1回、親投稿チェーンで2回
    expect(spyFindByUri).toHaveBeenCalledTimes(3);
    // ターゲット投稿のリプライ取得1回のみ
    expect(spyFindReplies).toHaveBeenCalledTimes(1);
    expect(spyFindPostView).toHaveBeenCalledTimes(1);
  });

  test("handleが含まれるURIの場合、DIDに変換してから投稿を取得する", async () => {
    // arrange
    const postUri = AtUri.make(
      "did:plc:handleuser",
      "app.bsky.feed.post",
      "handlepost123",
    );
    const actorDid = "did:plc:handleuser";
    const postRecord = {
      $type: "app.bsky.feed.post",
      text: "Post with handle URI",
      createdAt: "2024-01-01T00:00:00.000Z",
    };

    await ctx.db.insert(schema.actors).values({
      did: actorDid,
      handle: "handleuser.bsky.social",
    });

    await ctx.db.insert(schema.records).values({
      uri: postUri.toString(),
      cid: "bafyreihandlepost",
      actorDid,
      json: postRecord,
      indexedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    await ctx.db.insert(schema.posts).values({
      uri: postUri.toString(),
      cid: "bafyreihandlepost",
      actorDid,
      text: "Post with handle URI",
      createdAt: new Date(postRecord.createdAt),
    });

    const profileUri = `at://${actorDid}/app.bsky.actor.profile/self`;
    await ctx.db.insert(schema.records).values({
      uri: profileUri,
      cid: "bafyreihandleprofile",
      actorDid,
      json: {
        $type: "app.bsky.actor.profile",
        displayName: "Handle User",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      indexedAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    await ctx.db.insert(schema.profiles).values({
      uri: profileUri,
      cid: "bafyreihandleprofile",
      actorDid,
      displayName: "Handle User",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    // handleを使ったAtUriを作成
    const handleUri = new AtUri(
      "at://handleuser.bsky.social/app.bsky.feed.post/handlepost123",
    );

    // act
    const result = await getPostThreadUseCase.execute({
      uri: handleUri,
      depth: 6,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toMatchObject({
      $type: "app.bsky.feed.defs#threadViewPost",
      post: {
        uri: postUri.toString(),
        author: {
          did: actorDid,
          handle: "handleuser.bsky.social",
          displayName: "Handle User",
        },
        record: {
          text: "Post with handle URI",
        },
      },
      parent: undefined,
      replies: [],
    });
    // ターゲット投稿の取得で1回
    expect(spyFindByUri).toHaveBeenCalledTimes(1);
    // ターゲット投稿のリプライ取得1回のみ
    expect(spyFindReplies).toHaveBeenCalledTimes(1);
    expect(spyFindPostView).toHaveBeenCalledTimes(1);
  });

  test("handleが解決できない場合、notFoundPostを返す", async () => {
    // arrange
    const handleUri = new AtUri(
      "at://notfound.handle/app.bsky.feed.post/notfound123",
    );

    // act
    const result = await getPostThreadUseCase.execute({
      uri: handleUri,
      depth: 6,
      parentHeight: 80,
    });

    // assert
    expect(result.thread).toEqual({
      $type: "app.bsky.feed.defs#notFoundPost",
      uri: "at://notfound.handle/app.bsky.feed.post/notfound123",
      notFound: true,
    });
    // handle解決に失敗で以下はすべて実行されない
    expect(spyFindByUri).toHaveBeenCalledTimes(0);
    expect(spyFindReplies).toHaveBeenCalledTimes(0);
    expect(spyFindPostView).toHaveBeenCalledTimes(0);
  });
});
