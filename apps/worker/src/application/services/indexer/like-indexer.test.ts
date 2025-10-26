/* eslint-disable @typescript-eslint/unbound-method */
import { AtUri } from "@atproto/syntax";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  actorFactory,
  getTestSetup,
  postFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";

import { LikeIndexingPolicy } from "../../../domain/like-indexing-policy.js";
import { LikeRepository } from "../../../infrastructure/repositories/like-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/repositories/subscription-repository.js";
import type { AggregatePostStatsScheduler } from "../scheduler/aggregate-post-stats-scheduler.js";
import { LikeIndexer } from "./like-indexer.js";

describe("LikeIndexer", () => {
  const mockAggregatePostStatsScheduler = mock<AggregatePostStatsScheduler>();
  const { testInjector, ctx } = getTestSetup();

  const likeIndexer = testInjector
    .provideClass("likeRepository", LikeRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideValue("indexLevel", 1)
    .provideClass("likeIndexingPolicy", LikeIndexingPolicy)
    .provideValue(
      "aggregatePostStatsScheduler",
      mockAggregatePostStatsScheduler,
    )
    .injectClass(LikeIndexer);

  describe("upsert", () => {
    test("subscriberのいいねは実際にDBに保存される", async () => {
      // arrange
      // subscriberとしてactor情報を準備
      const subscriberActor = await actorFactory(ctx.db).create();
      // subscriptionレコード用のrecordsテーブルエントリ
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriberActor })
        .create();

      // いいねレコード用のrecordsテーブルエントリ
      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: "at://did:plc:other/app.bsky.feed.post/123",
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        },
        createdAt: new Date().toISOString(),
      };
      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => subscriberActor })
        .props({
          uri: () => `at://${subscriberActor.did}/app.bsky.feed.like/123`,
          cid: () => "abc123",
          json: () => likeJson,
        })
        .create();
      const record = Record.fromJson({
        uri: likeRecord.uri,
        cid: likeRecord.cid,
        json: likeJson,
        indexedAt: new Date(),
      });

      // act
      await likeIndexer.upsert({ ctx, record });

      // assert
      const [like] = await ctx.db
        .select()
        .from(schema.likes)
        .where(eq(schema.likes.uri, record.uri.toString()))
        .limit(1);
      expect(like).toBeDefined();
    });
  });

  describe("afterAction", () => {
    test("いいね追加の場合、対象投稿に対してlike集計ジョブがスケジュールされる", async () => {
      // arrange
      const post = await postFactory(ctx.db).create();

      const likerActor = await actorFactory(ctx.db).create();
      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: post.uri,
          cid: post.cid,
        },
        createdAt: new Date().toISOString(),
      };
      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => likerActor })
        .props({ json: () => likeJson })
        .create();
      const record = Record.fromJson({
        uri: likeRecord.uri,
        cid: likeRecord.cid,
        json: likeJson,
        indexedAt: new Date(),
      });

      // act
      await likeIndexer.afterAction({ ctx, record });

      // assert
      expect(mockAggregatePostStatsScheduler.schedule).toHaveBeenCalledWith(
        new AtUri(post.uri),
        "like",
      );
    });

    test("いいね削除の場合も、対象投稿に対してlike集計ジョブがスケジュールされる", async () => {
      // arrange
      const post = await postFactory(ctx.db).create();

      const likerActor = await actorFactory(ctx.db).create();
      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: post.uri,
          cid: post.cid,
        },
        createdAt: new Date().toISOString(),
      };
      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => likerActor })
        .props({ json: () => likeJson })
        .create();
      const record = Record.fromJson({
        uri: likeRecord.uri,
        cid: likeRecord.cid,
        json: likeJson,
        indexedAt: new Date(),
      });

      // act
      await likeIndexer.afterAction({ ctx, record });

      // assert
      expect(mockAggregatePostStatsScheduler.schedule).toHaveBeenCalledWith(
        new AtUri(post.uri),
        "like",
      );
    });

    test("対象の投稿が存在しない場合でも集計ジョブがスケジュールされる", async () => {
      // arrange
      const likerActor = await actorFactory(ctx.db).create();
      const nonExistentPostUri =
        "at://did:plc:nonexistent/app.bsky.feed.post/999";

      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: nonExistentPostUri,
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        },
        createdAt: new Date().toISOString(),
      };
      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => likerActor })
        .props({ json: () => likeJson })
        .create();
      const record = Record.fromJson({
        uri: likeRecord.uri,
        cid: likeRecord.cid,
        json: likeJson,
        indexedAt: new Date(),
      });

      // act
      await likeIndexer.afterAction({ ctx, record });

      // assert
      expect(mockAggregatePostStatsScheduler.schedule).toHaveBeenCalledWith(
        new AtUri(nonExistentPostUri),
        "like",
      );
    });
  });
});
