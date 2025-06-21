import type { TransactionContext } from "@repo/common/domain";
import {
  actorFactory,
  followFactory,
  postFactory,
  recordFactory,
  setupTestDatabase,
} from "@repo/test-utils";
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
    const actor = await actorFactory(ctx.db).create();

    // act
    const result = await getTimelineUseCase.execute({ limit: 50 }, actor.did);

    // assert
    expect(result).toMatchObject({
      feed: [],
    });
  });

  test("フォローしているユーザーが投稿している場合、そのユーザーの投稿を返す", async () => {
    // arrange
    const authActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Auth User" }))
      .create();
    const followeeActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Followee User" }))
      .create();

    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => authActor })
            .create(),
        followee: () => followeeActor,
      })
      .create();

    const post = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => followeeActor })
            .create(),
      })
      .create();

    // act
    const result = await getTimelineUseCase.execute(
      { limit: 50 },
      authActor.did,
    );

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
    const authActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Self User" }))
      .create();

    const selfPost = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => authActor })
            .props({
              json: () => ({
                $type: "app.bsky.feed.post",
                text: "My own post",
              }),
            })
            .create(),
      })
      .props({ text: () => "My own post" })
      .create();

    // act
    const result = await getTimelineUseCase.execute(
      { limit: 50 },
      authActor.did,
    );

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
    const authActor = await actorFactory(ctx.db).create();
    const followeeActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Pagination Followee" }))
      .create();

    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => authActor })
            .create(),
        followee: () => followeeActor,
      })
      .create();

    // 複数の投稿を時系列で作成
    await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => followeeActor })
            .props({
              json: () => ({ $type: "app.bsky.feed.post", text: "First post" }),
            })
            .create(),
      })
      .props({
        text: () => "First post",
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();

    await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => followeeActor })
            .props({
              json: () => ({
                $type: "app.bsky.feed.post",
                text: "Second post",
              }),
            })
            .create(),
      })
      .props({
        text: () => "Second post",
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();

    await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => followeeActor })
            .props({
              json: () => ({ $type: "app.bsky.feed.post", text: "Third post" }),
            })
            .create(),
      })
      .props({
        text: () => "Third post",
        createdAt: () => new Date("2024-01-01T03:00:00.000Z"),
      })
      .create();

    // act - 最初のページ（limit=2）
    const firstPage = await getTimelineUseCase.execute(
      { limit: 2 },
      authActor.did,
    );

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
      authActor.did,
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
    const authActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Limit User" }))
      .create();

    const post = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => authActor })
            .props({
              json: () => ({
                $type: "app.bsky.feed.post",
                text: "Limit test post",
              }),
            })
            .create(),
      })
      .props({ text: () => "Limit test post" })
      .create();

    // act - limit=0
    const zeroLimitResult = await getTimelineUseCase.execute(
      { limit: 0 },
      authActor.did,
    );

    // assert
    expect(zeroLimitResult).toMatchObject({
      feed: [],
    });

    // act - limit=1
    const oneLimitResult = await getTimelineUseCase.execute(
      { limit: 1 },
      authActor.did,
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
    const authActor = await actorFactory(ctx.db).create();
    const followeeActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Sort Followee" }))
      .create();

    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => authActor })
            .create(),
        followee: () => followeeActor,
      })
      .create();

    // 異なる時間の投稿を作成（sortAtの順序を確認するため）
    const earlyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => followeeActor })
      .props({
        json: () => ({ $type: "app.bsky.feed.post", text: "Early post" }),
        indexedAt: () => new Date("2024-01-01T01:30:00.000Z"),
      })
      .create();
    await postFactory(ctx.db)
      .vars({ record: () => earlyRecord })
      .props({
        text: () => "Early post",
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        indexedAt: () => new Date("2024-01-01T01:30:00.000Z"),
      })
      .create();

    const latestRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => followeeActor })
      .props({
        json: () => ({ $type: "app.bsky.feed.post", text: "Latest post" }),
        indexedAt: () => new Date("2024-01-01T02:30:00.000Z"),
      })
      .create();
    await postFactory(ctx.db)
      .vars({ record: () => latestRecord })
      .props({
        text: () => "Latest post",
        createdAt: () => new Date("2024-01-01T03:00:00.000Z"),
        indexedAt: () => new Date("2024-01-01T02:30:00.000Z"),
      })
      .create();

    const middleRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => followeeActor })
      .props({
        json: () => ({ $type: "app.bsky.feed.post", text: "Middle post" }),
        indexedAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();
    await postFactory(ctx.db)
      .vars({ record: () => middleRecord })
      .props({
        text: () => "Middle post",
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        indexedAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();

    // act
    const result = await getTimelineUseCase.execute(
      { limit: 50 },
      authActor.did,
    );

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
    const authActor = await actorFactory(ctx.db).create();
    const rootAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Root Author" }))
      .create();
    const parentAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Parent Author" }))
      .create();
    const replyAuthor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Reply Author" }))
      .create();

    await followFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.graph.follow")
            .vars({ actor: () => authActor })
            .create(),
        followee: () => replyAuthor,
      })
      .create();

    // 根投稿を作成
    const rootPost = await postFactory(ctx.db)
      .vars({
        record: () =>
          recordFactory(ctx.db, "app.bsky.feed.post")
            .vars({ actor: () => rootAuthor })
            .create(),
      })
      .props({
        text: () => "Root post",
        createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
      })
      .create();

    // 中間投稿（根投稿へのリプライ）を作成
    const parentRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => parentAuthor })
      .create();
    const parentPost = await postFactory(ctx.db)
      .vars({ record: () => parentRecord })
      .props({
        text: () => "Parent reply to root",
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => rootPost.uri,
        replyParentCid: () => rootPost.cid,
        createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
      })
      .create();

    // 最終リプライ投稿（中間投稿へのリプライ）を作成
    const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => replyAuthor })
      .create();
    const replyPost = await postFactory(ctx.db)
      .vars({ record: () => replyRecord })
      .props({
        text: () => "Reply to parent post",
        replyRootUri: () => rootPost.uri,
        replyRootCid: () => rootPost.cid,
        replyParentUri: () => parentPost.uri,
        replyParentCid: () => parentPost.cid,
        createdAt: () => new Date("2024-01-01T03:00:00.000Z"),
      })
      .create();

    // act
    const result = await getTimelineUseCase.execute(
      { limit: 50 },
      authActor.did,
    );

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
          },
          reply: {
            $type: "app.bsky.feed.defs#replyRef",
            root: {
              uri: rootPost.uri,
              author: {
                displayName: "Root Author",
              },
            },
            parent: {
              uri: parentPost.uri,
              author: {
                displayName: "Parent Author",
              },
            },
          },
        },
      ],
    });
  });
});
