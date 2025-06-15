import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { beforeAll, describe, expect, test } from "vitest";

import { HandleResolver } from "../infrastructure/handle-resolver.js";
import { PostRepository } from "../infrastructure/post-repository.js";
import { PostStatsRepository } from "../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../infrastructure/profile-repository.js";
import { RecordRepository } from "../infrastructure/record-repository.js";
import { TimelineRepository } from "../infrastructure/timeline-repository.js";
import { GetTimelineUseCase } from "./get-timeline-use-case.js";
import { AtUriService } from "./service/at-uri-service.js";
import { EmbedViewService } from "./service/embed-view-service.js";
import { PostViewService } from "./service/post-view-service.js";
import { ProfileViewService } from "./service/profile-view-service.js";
import { ReplyRefService } from "./service/reply-ref-service.js";
import { TimelineService } from "./service/timeline-service.js";

let getTimelineUseCase: GetTimelineUseCase;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  getTimelineUseCase = testSetup.testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("handleResolver", HandleResolver)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("timelineRepository", TimelineRepository)
    .provideClass("embedViewService", EmbedViewService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("postViewService", PostViewService)
    .provideClass("replyRefService", ReplyRefService)
    .provideClass("timelineService", TimelineService)
    .provideClass("atUriService", AtUriService)
    .injectClass(GetTimelineUseCase);
  ctx = testSetup.ctx;
});

describe("GetTimelineUseCase", () => {
  test("フォローしているユーザーがいない場合、空のタイムラインを返す", async () => {
    // arrange
    const authDid = "did:plc:nofollows";

    await ctx.db.insert(schema.actors).values({
      did: authDid,
      handle: "nofollows.bsky.social",
    });

    // act
    const result = await getTimelineUseCase.execute({ limit: 50 }, authDid);

    // assert
    expect(result).toMatchObject({
      feed: [],
    });
  });

  test("フォローしているユーザーが投稿している場合、そのユーザーの投稿を返す", async () => {
    // arrange
    const authDid = "did:plc:user-1";
    const followeeDid = "did:plc:followee-1";

    const authActor = { did: authDid, handle: "auth1.test.com" };
    const followeeActor = { did: followeeDid, handle: "followee1.test.com" };

    await ctx.db.insert(schema.actors).values([authActor, followeeActor]);

    // フォロー関係を作成
    const followUri = "at://did:plc:user-1/app.bsky.graph.follow/test";
    await ctx.db.insert(schema.records).values({
      uri: followUri,
      cid: "follow-cid",
      actorDid: authDid,
      json: { subject: followeeDid },
    });
    await ctx.db.insert(schema.follows).values({
      uri: followUri,
      cid: "follow-cid",
      actorDid: authDid,
      subjectDid: followeeDid,
      createdAt: new Date(),
    });

    // フォロイーの投稿を作成
    const post = {
      uri: "at://did:plc:followee-1/app.bsky.feed.post/test",
      cid: "post-cid",
      actorDid: followeeDid,
      text: "test post",
      createdAt: new Date(),
    };
    await ctx.db.insert(schema.records).values({
      uri: post.uri,
      cid: post.cid,
      actorDid: post.actorDid,
      json: { text: "test post" },
    });
    await ctx.db.insert(schema.posts).values(post);

    // プロフィールを作成
    const profileUri = `at://${followeeDid}/app.bsky.actor.profile/self`;
    await ctx.db.insert(schema.records).values({
      uri: profileUri,
      cid: "profile-cid",
      actorDid: followeeDid,
      json: {
        $type: "app.bsky.actor.profile",
        displayName: "Followee User",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    });
    await ctx.db.insert(schema.profiles).values({
      uri: profileUri,
      cid: "profile-cid",
      actorDid: followeeDid,
      displayName: "Followee User",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    // act
    const result = await getTimelineUseCase.execute({ limit: 50 }, authDid);

    // assert
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: post.uri,
            author: {
              displayName: "Followee User",
            },
          },
        },
      ],
    });
  });

  test("自分の投稿がある場合、自分の投稿も含める", async () => {
    // arrange
    const authDid = "did:plc:self-user";

    await ctx.db.insert(schema.actors).values({
      did: authDid,
      handle: "selfuser.bsky.social",
    });

    // 自分の投稿を作成
    const selfPost = {
      uri: "at://did:plc:self-user/app.bsky.feed.post/self123",
      cid: "self-post-cid",
      actorDid: authDid,
      text: "My own post",
      createdAt: new Date(),
    };
    await ctx.db.insert(schema.records).values({
      uri: selfPost.uri,
      cid: selfPost.cid,
      actorDid: selfPost.actorDid,
      json: { text: "My own post" },
    });
    await ctx.db.insert(schema.posts).values(selfPost);

    // プロフィールを作成
    const profileUri = `at://${authDid}/app.bsky.actor.profile/self`;
    await ctx.db.insert(schema.records).values({
      uri: profileUri,
      cid: "self-profile-cid",
      actorDid: authDid,
      json: {
        $type: "app.bsky.actor.profile",
        displayName: "Self User",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    });
    await ctx.db.insert(schema.profiles).values({
      uri: profileUri,
      cid: "self-profile-cid",
      actorDid: authDid,
      displayName: "Self User",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    // act
    const result = await getTimelineUseCase.execute({ limit: 50 }, authDid);

    // assert
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: selfPost.uri,
            author: {
              displayName: "Self User",
            },
            record: {
              text: "My own post",
            },
          },
        },
      ],
    });
  });

  test("カーソルを指定した場合、ページネーションが動作する", async () => {
    // arrange
    const authDid = "did:plc:pagination-user";
    const followeeDid = "did:plc:pagination-followee";

    await ctx.db.insert(schema.actors).values([
      { did: authDid, handle: "paginationuser.bsky.social" },
      { did: followeeDid, handle: "paginationfollowee.bsky.social" },
    ]);

    // フォロー関係を作成
    const followUri = "at://did:plc:pagination-user/app.bsky.graph.follow/test";
    await ctx.db.insert(schema.records).values({
      uri: followUri,
      cid: "follow-cid",
      actorDid: authDid,
      json: { subject: followeeDid },
    });
    await ctx.db.insert(schema.follows).values({
      uri: followUri,
      cid: "follow-cid",
      actorDid: authDid,
      subjectDid: followeeDid,
      createdAt: new Date(),
    });

    // 複数の投稿を時系列で作成
    const posts = [
      {
        uri: "at://did:plc:pagination-followee/app.bsky.feed.post/post1",
        cid: "post1-cid",
        actorDid: followeeDid,
        text: "First post",
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
      },
      {
        uri: "at://did:plc:pagination-followee/app.bsky.feed.post/post2",
        cid: "post2-cid",
        actorDid: followeeDid,
        text: "Second post",
        createdAt: new Date("2024-01-01T02:00:00.000Z"),
      },
      {
        uri: "at://did:plc:pagination-followee/app.bsky.feed.post/post3",
        cid: "post3-cid",
        actorDid: followeeDid,
        text: "Third post",
        createdAt: new Date("2024-01-01T03:00:00.000Z"),
      },
    ];

    await ctx.db.insert(schema.records).values(
      posts.map((post) => ({
        uri: post.uri,
        cid: post.cid,
        actorDid: post.actorDid,
        json: { text: post.text },
      })),
    );
    await ctx.db.insert(schema.posts).values(posts);

    // プロフィールを作成
    const profileUri = `at://${followeeDid}/app.bsky.actor.profile/self`;
    await ctx.db.insert(schema.records).values({
      uri: profileUri,
      cid: "profile-cid",
      actorDid: followeeDid,
      json: {
        $type: "app.bsky.actor.profile",
        displayName: "Pagination Followee",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    });
    await ctx.db.insert(schema.profiles).values({
      uri: profileUri,
      cid: "profile-cid",
      actorDid: followeeDid,
      displayName: "Pagination Followee",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    // act - 最初のページ（limit=2）
    const firstPage = await getTimelineUseCase.execute({ limit: 2 }, authDid);

    // assert - 最新の2件が返される
    expect(firstPage).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            record: {
              text: "Third post",
            },
          },
        },
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            record: {
              text: "Second post",
            },
          },
        },
      ],
      cursor: expect.any(String),
    });

    // act - 次のページ
    const secondPage = await getTimelineUseCase.execute(
      { limit: 2, cursor: firstPage.cursor },
      authDid,
    );

    // assert - 残りの1件が返される
    expect(secondPage).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            record: {
              text: "First post",
            },
          },
        },
      ],
    });
    expect(secondPage.cursor).toBeUndefined();
  });

  test("limitパラメータが0または1の場合、指定した件数の投稿を返す", async () => {
    // arrange
    const authDid = "did:plc:limit-user";

    await ctx.db.insert(schema.actors).values({
      did: authDid,
      handle: "limituser.bsky.social",
    });

    // 1つの投稿を作成
    const post = {
      uri: "at://did:plc:limit-user/app.bsky.feed.post/limit123",
      cid: "limit-post-cid",
      actorDid: authDid,
      text: "Limit test post",
      createdAt: new Date(),
    };
    await ctx.db.insert(schema.records).values({
      uri: post.uri,
      cid: post.cid,
      actorDid: post.actorDid,
      json: { text: post.text },
    });
    await ctx.db.insert(schema.posts).values(post);

    // プロフィールを作成
    const profileUri = `at://${authDid}/app.bsky.actor.profile/self`;
    await ctx.db.insert(schema.records).values({
      uri: profileUri,
      cid: "limit-profile-cid",
      actorDid: authDid,
      json: {
        $type: "app.bsky.actor.profile",
        displayName: "Limit User",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    });
    await ctx.db.insert(schema.profiles).values({
      uri: profileUri,
      cid: "limit-profile-cid",
      actorDid: authDid,
      displayName: "Limit User",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    // act - limit=0
    const zeroLimitResult = await getTimelineUseCase.execute(
      { limit: 0 },
      authDid,
    );

    // assert
    expect(zeroLimitResult).toMatchObject({
      feed: [],
    });

    // act - limit=1
    const oneLimitResult = await getTimelineUseCase.execute(
      { limit: 1 },
      authDid,
    );

    // assert
    expect(oneLimitResult).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: post.uri,
          },
        },
      ],
    });
  });

  test("複数の投稿がある場合、sortAt（indexedAtとcreatedAtの早い方）の降順でソートされて返す", async () => {
    // arrange
    const authDid = "did:plc:sort-user";
    const followeeDid = "did:plc:sort-followee";

    await ctx.db.insert(schema.actors).values([
      { did: authDid, handle: "sortuser.bsky.social" },
      { did: followeeDid, handle: "sortfollowee.bsky.social" },
    ]);

    // フォロー関係を作成
    const followUri = "at://did:plc:sort-user/app.bsky.graph.follow/test";
    await ctx.db.insert(schema.records).values({
      uri: followUri,
      cid: "follow-cid",
      actorDid: authDid,
      json: { subject: followeeDid },
    });
    await ctx.db.insert(schema.follows).values({
      uri: followUri,
      cid: "follow-cid",
      actorDid: authDid,
      subjectDid: followeeDid,
      createdAt: new Date(),
    });

    // 異なる時間の投稿を作成（sortAtの順序を確認するため）
    const posts = [
      {
        uri: "at://did:plc:sort-followee/app.bsky.feed.post/early",
        cid: "early-cid",
        actorDid: followeeDid,
        text: "Early post",
        createdAt: new Date("2024-01-01T01:00:00.000Z"),
        indexedAt: new Date("2024-01-01T01:30:00.000Z"), // sortAt = 2024-01-01T01:00:00.000Z (createdAtが早い)
      },
      {
        uri: "at://did:plc:sort-followee/app.bsky.feed.post/latest",
        cid: "latest-cid",
        actorDid: followeeDid,
        text: "Latest post",
        createdAt: new Date("2024-01-01T03:00:00.000Z"),
        indexedAt: new Date("2024-01-01T02:30:00.000Z"), // sortAt = 2024-01-01T02:30:00.000Z (indexedAtが早い)
      },
      {
        uri: "at://did:plc:sort-followee/app.bsky.feed.post/middle",
        cid: "middle-cid",
        actorDid: followeeDid,
        text: "Middle post",
        createdAt: new Date("2024-01-01T02:00:00.000Z"),
        indexedAt: new Date("2024-01-01T02:00:00.000Z"), // sortAt = 2024-01-01T02:00:00.000Z
      },
    ];

    await ctx.db.insert(schema.records).values(
      posts.map((post) => ({
        uri: post.uri,
        cid: post.cid,
        actorDid: post.actorDid,
        json: { text: post.text },
        indexedAt: post.indexedAt,
      })),
    );
    await ctx.db.insert(schema.posts).values(
      posts.map((post) => ({
        uri: post.uri,
        cid: post.cid,
        actorDid: post.actorDid,
        text: post.text,
        createdAt: post.createdAt,
        indexedAt: post.indexedAt,
      })),
    );

    // プロフィールを作成
    const profileUri = `at://${followeeDid}/app.bsky.actor.profile/self`;
    await ctx.db.insert(schema.records).values({
      uri: profileUri,
      cid: "profile-cid",
      actorDid: followeeDid,
      json: {
        $type: "app.bsky.actor.profile",
        displayName: "Sort Followee",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    });
    await ctx.db.insert(schema.profiles).values({
      uri: profileUri,
      cid: "profile-cid",
      actorDid: followeeDid,
      displayName: "Sort Followee",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });

    // act
    const result = await getTimelineUseCase.execute({ limit: 50 }, authDid);

    // assert
    // sortAtの降順：Latest(02:30) > Middle(02:00) > Early(01:00)
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            record: {
              text: "Latest post",
            },
          },
        },
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            record: {
              text: "Middle post",
            },
          },
        },
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            record: {
              text: "Early post",
            },
          },
        },
      ],
    });
  });

  test("リプライがある場合、reply情報を含むfeedViewPostを返す", async () => {
    // arrange
    const authDid = "did:plc:reply-user";
    const rootAuthorDid = "did:plc:root-author";
    const parentAuthorDid = "did:plc:parent-author";
    const replyAuthorDid = "did:plc:reply-author";

    await ctx.db.insert(schema.actors).values([
      { did: authDid, handle: "replyuser.bsky.social" },
      { did: rootAuthorDid, handle: "rootauthor.bsky.social" },
      { did: parentAuthorDid, handle: "parentauthor.bsky.social" },
      { did: replyAuthorDid, handle: "replyauthor.bsky.social" },
    ]);

    // フォロー関係を作成（authがreplyAuthorをフォロー）
    const followUri = "at://did:plc:reply-user/app.bsky.graph.follow/test";
    await ctx.db.insert(schema.records).values({
      uri: followUri,
      cid: "follow-cid",
      actorDid: authDid,
      json: { subject: replyAuthorDid },
    });
    await ctx.db.insert(schema.follows).values({
      uri: followUri,
      cid: "follow-cid",
      actorDid: authDid,
      subjectDid: replyAuthorDid,
      createdAt: new Date(),
    });

    // 根投稿を作成
    const rootPost = {
      uri: "at://did:plc:root-author/app.bsky.feed.post/root123",
      cid: "root-post-cid",
      actorDid: rootAuthorDid,
      text: "Root post",
      createdAt: new Date("2024-01-01T01:00:00.000Z"),
    };
    await ctx.db.insert(schema.records).values({
      uri: rootPost.uri,
      cid: rootPost.cid,
      actorDid: rootPost.actorDid,
      json: { text: rootPost.text },
    });
    await ctx.db.insert(schema.posts).values(rootPost);

    // 中間投稿（根投稿へのリプライ）を作成
    const parentPost = {
      uri: "at://did:plc:parent-author/app.bsky.feed.post/parent123",
      cid: "parent-post-cid",
      actorDid: parentAuthorDid,
      text: "Parent reply to root",
      replyRootUri: rootPost.uri,
      replyRootCid: rootPost.cid,
      replyParentUri: rootPost.uri,
      replyParentCid: rootPost.cid,
      createdAt: new Date("2024-01-01T02:00:00.000Z"),
    };
    await ctx.db.insert(schema.records).values({
      uri: parentPost.uri,
      cid: parentPost.cid,
      actorDid: parentPost.actorDid,
      json: {
        text: parentPost.text,
        reply: {
          root: { uri: rootPost.uri, cid: rootPost.cid },
          parent: { uri: rootPost.uri, cid: rootPost.cid },
        },
      },
    });
    await ctx.db.insert(schema.posts).values(parentPost);

    // 最終リプライ投稿（中間投稿へのリプライ）を作成
    const replyPost = {
      uri: "at://did:plc:reply-author/app.bsky.feed.post/reply123",
      cid: "reply-post-cid",
      actorDid: replyAuthorDid,
      text: "Reply to parent post",
      replyRootUri: rootPost.uri,
      replyRootCid: rootPost.cid,
      replyParentUri: parentPost.uri,
      replyParentCid: parentPost.cid,
      createdAt: new Date("2024-01-01T03:00:00.000Z"),
    };
    await ctx.db.insert(schema.records).values({
      uri: replyPost.uri,
      cid: replyPost.cid,
      actorDid: replyPost.actorDid,
      json: {
        text: replyPost.text,
        reply: {
          root: { uri: rootPost.uri, cid: rootPost.cid },
          parent: { uri: parentPost.uri, cid: parentPost.cid },
        },
      },
    });
    await ctx.db.insert(schema.posts).values(replyPost);

    // プロフィールを作成
    const profiles = [
      {
        uri: `at://${rootAuthorDid}/app.bsky.actor.profile/self`,
        cid: "root-profile-cid",
        actorDid: rootAuthorDid,
        displayName: "Root Author",
      },
      {
        uri: `at://${parentAuthorDid}/app.bsky.actor.profile/self`,
        cid: "parent-profile-cid",
        actorDid: parentAuthorDid,
        displayName: "Parent Author",
      },
      {
        uri: `at://${replyAuthorDid}/app.bsky.actor.profile/self`,
        cid: "reply-profile-cid",
        actorDid: replyAuthorDid,
        displayName: "Reply Author",
      },
    ];

    await ctx.db.insert(schema.records).values(
      profiles.map((profile) => ({
        uri: profile.uri,
        cid: profile.cid,
        actorDid: profile.actorDid,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: profile.displayName,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      })),
    );
    await ctx.db.insert(schema.profiles).values(
      profiles.map((profile) => ({
        uri: profile.uri,
        cid: profile.cid,
        actorDid: profile.actorDid,
        displayName: profile.displayName,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      })),
    );

    // act
    const result = await getTimelineUseCase.execute({ limit: 50 }, authDid);

    // assert
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: replyPost.uri,
            author: {
              displayName: "Reply Author",
            },
            record: {
              text: "Reply to parent post",
            },
          },
          reply: {
            $type: "app.bsky.feed.defs#replyRef",
            root: {
              uri: rootPost.uri,
              author: {
                displayName: "Root Author",
              },
              record: {
                text: "Root post",
              },
            },
            parent: {
              uri: parentPost.uri,
              author: {
                displayName: "Parent Author",
              },
              record: {
                text: "Parent reply to root",
              },
            },
          },
        },
      ],
    });
  });
});
