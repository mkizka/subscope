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
    .provideClass("timelineService", TimelineService)
    .provideClass("atUriService", AtUriService)
    .injectClass(GetTimelineUseCase);
  ctx = testSetup.ctx;
});

describe("GetTimelineUseCase", () => {
  test("フォローしているユーザーがいない場合は空のタイムラインを返す", async () => {
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

  test("フォローしているユーザーの投稿を返す", async () => {
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

  test("自分の投稿も含める", async () => {
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

  test("カーソルベースのページネーションが動作する", async () => {
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

    for (const post of posts) {
      await ctx.db.insert(schema.records).values({
        uri: post.uri,
        cid: post.cid,
        actorDid: post.actorDid,
        json: { text: post.text },
      });
      await ctx.db.insert(schema.posts).values(post);
    }

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

  test("限界値のlimitパラメータが正しく動作する", async () => {
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
});
