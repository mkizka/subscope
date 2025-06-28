import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import {
  actorFactory,
  postFactory,
  postFeedItemFactory,
  recordFactory,
  repostFactory,
  repostFeedItemFactory,
  setupTestDatabase,
} from "@repo/test-utils";
import { beforeAll, describe, expect, test } from "vitest";

import { AtUriService } from "../domain/service/at-uri-service.js";
import { ActorStatsRepository } from "../infrastructure/actor-stats-repository.js";
import { AuthorFeedRepository } from "../infrastructure/author-feed-repository.js";
import { HandleResolver } from "../infrastructure/handle-resolver.js";
import { PostRepository } from "../infrastructure/post-repository.js";
import { PostStatsRepository } from "../infrastructure/post-stats-repository.js";
import { ProfileRepository } from "../infrastructure/profile-repository.js";
import { RecordRepository } from "../infrastructure/record-repository.js";
import { GetAuthorFeedUseCase } from "./get-author-feed-use-case.js";
import { AuthorFeedService } from "./service/author-feed-service.js";
import { EmbedViewService } from "./service/embed-view-service.js";
import { PostViewService } from "./service/post-view-service.js";
import { ProfileViewService } from "./service/profile-view-service.js";
import { ReplyRefService } from "./service/reply-ref-service.js";

let getAuthorFeedUseCase: GetAuthorFeedUseCase;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  getAuthorFeedUseCase = testSetup.testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("handleResolver", HandleResolver)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("authorFeedRepository", AuthorFeedRepository)
    .provideClass("embedViewService", EmbedViewService)
    .provideClass("profileViewService", ProfileViewService)
    .provideClass("postViewService", PostViewService)
    .provideClass("replyRefService", ReplyRefService)
    .provideClass("authorFeedService", AuthorFeedService)
    .provideClass("atUriService", AtUriService)
    .injectClass(GetAuthorFeedUseCase);
  ctx = testSetup.ctx;
});

describe("GetAuthorFeedUseCase", () => {
  test("投稿がない場合、空のフィードを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
      filter: "posts_and_author_threads",
      includePins: false,
    });

    // assert
    expect(result).toMatchObject({
      feed: [],
    });
  });

  test("投稿がある場合、投稿情報を返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Test User" }))
      .create();

    // 投稿とfeed_itemを作成
    const record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "Hello, World!",
          createdAt: new Date().toISOString(),
        }),
      })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => record })
      .props({
        text: () => "Hello, World!",
      })
      .create();
    const feedItem = await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
      filter: "posts_and_author_threads",
      includePins: false,
    });

    // assert
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: post.uri,
            author: {
              displayName: "Test User",
            },
            record: {
              text: "Hello, World!",
            },
          },
        },
      ],
    });
  });

  test("リポストがある場合、リポストを含むフィードを返す", async () => {
    // arrange
    const originalActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Original User" }))
      .create();
    const originalRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => originalActor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "Original post",
          createdAt: new Date().toISOString(),
        }),
      })
      .create();
    const originalPost = await postFactory(ctx.db)
      .vars({ record: () => originalRecord })
      .props({
        text: () => "Original post",
      })
      .create();

    const repostActor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Repost User" }))
      .create();
    const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
      .vars({ actor: () => repostActor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.repost",
          subject: {
            uri: originalPost.uri,
            cid: originalPost.cid,
          },
          createdAt: new Date().toISOString(),
        }),
      })
      .create();
    const repost = await repostFactory(ctx.db)
      .vars({ record: () => repostRecord })
      .props({
        subjectUri: () => originalPost.uri,
        subjectCid: () => originalPost.cid,
      })
      .create();

    // feed_itemを作成
    await repostFeedItemFactory(ctx.db)
      .vars({ repost: () => repost })
      .create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(repostActor.did),
      limit: 50,
      filter: "posts_and_author_threads",
      includePins: false,
    });

    // assert
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: originalPost.uri,
            author: {
              displayName: "Original User",
            },
            record: {
              text: "Original post",
            },
          },
          reason: {
            $type: "app.bsky.feed.defs#reasonRepost",
            by: {
              displayName: "Repost User",
            },
          },
        },
      ],
    });
  });

  test("limitパラメータが適用される", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) => t.withProfile({ displayName: "Test User" }))
      .create();

    // 2つの投稿とfeed_itemを作成
    for (let i = 0; i < 2; i++) {
      const record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: `Post ${i + 1}`,
            createdAt: new Date().toISOString(),
          }),
        })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => record })
        .props({
          text: () => `Post ${i + 1}`,
        })
        .create();
      await postFeedItemFactory(ctx.db)
        .vars({ post: () => post })
        .create();
    }

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 1,
      filter: "posts_and_author_threads",
      includePins: false,
    });

    // assert
    expect(result.feed).toHaveLength(1);
  });

  test("サポートされていないフィルターの場合、空のフィードを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
      filter: "posts_with_media",
      includePins: false,
    });

    // assert
    expect(result).toMatchObject({
      feed: [],
    });
  });

  test("DIDを指定した場合に正しく動作する", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .use((t) =>
        t.withProfile({
          displayName: "Test User",
        }),
      )
      .props({
        handle: () => "test.bsky.social",
      })
      .create();
    const record = await recordFactory(ctx.db, "app.bsky.feed.post")
      .vars({ actor: () => actor })
      .props({
        json: () => ({
          $type: "app.bsky.feed.post",
          text: "Hello from handle!",
          createdAt: new Date().toISOString(),
        }),
      })
      .create();
    const post = await postFactory(ctx.db)
      .vars({ record: () => record })
      .props({
        text: () => "Hello from handle!",
      })
      .create();
    await postFeedItemFactory(ctx.db)
      .vars({ post: () => post })
      .create();

    // act
    const result = await getAuthorFeedUseCase.execute({
      actorDid: asDid(actor.did),
      limit: 50,
      filter: "posts_and_author_threads",
      includePins: false,
    });

    // assert
    expect(result).toMatchObject({
      feed: [
        {
          $type: "app.bsky.feed.defs#feedViewPost",
          post: {
            uri: post.uri,
            author: {
              displayName: "Test User",
            },
            record: {
              text: "Hello from handle!",
            },
          },
        },
      ],
    });
  });
});
