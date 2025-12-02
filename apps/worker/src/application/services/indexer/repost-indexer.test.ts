/* eslint-disable @typescript-eslint/unbound-method */
import { AtUri } from "@atproto/syntax";
import type { IJobQueue } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  actorFactory,
  postFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";

import { RepostIndexingPolicy } from "../../../domain/repost-indexing-policy.js";
import { FeedItemRepository } from "../../../infrastructure/repositories/feed-item-repository.js";
import { PostRepository } from "../../../infrastructure/repositories/post-repository/post-repository.js";
import { PostgresIndexTargetRepository } from "../../../infrastructure/repositories/postgres-index-target-repository.js";
import { RepostRepository } from "../../../infrastructure/repositories/repost-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/repositories/subscription-repository.js";
import { TrackedActorChecker } from "../../../infrastructure/repositories/tracked-actor-checker.js";
import type { AggregatePostStatsScheduler } from "../scheduler/aggregate-post-stats-scheduler.js";
import { FetchRecordScheduler } from "../scheduler/fetch-record-scheduler.js";
import { RepostIndexer } from "./repost-indexer.js";

describe("RepostIndexer", () => {
  const mockJobQueue = mock<IJobQueue>();
  const mockAggregatePostStatsScheduler = mock<AggregatePostStatsScheduler>();
  const { testInjector, ctx } = testSetup;

  const repostIndexer = testInjector
    .provideClass("repostRepository", RepostRepository)
    .provideValue(
      "aggregatePostStatsScheduler",
      mockAggregatePostStatsScheduler,
    )
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("trackedActorChecker", TrackedActorChecker)
    .provideClass("indexTargetRepository", PostgresIndexTargetRepository)
    .provideClass("postRepository", PostRepository)
    .provideClass("repostIndexingPolicy", RepostIndexingPolicy)
    .provideClass("feedItemRepository", FeedItemRepository)
    .provideValue("jobQueue", mockJobQueue)
    .provideClass("fetchRecordScheduler", FetchRecordScheduler)
    .injectClass(RepostIndexer);

  describe("upsert", () => {
    test("リポストレコードを正しく保存する", async () => {
      // arrange
      const [reposter, author] = await actorFactory(ctx.db).createList(2);
      const subjectUri = `at://${author.did}/app.bsky.feed.post/123`;

      const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ actor: () => reposter })
        .props({
          json: () => ({
            $type: "app.bsky.feed.repost",
            subject: {
              uri: subjectUri,
              cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
            },
            createdAt: new Date().toISOString(),
          }),
        })
        .create();

      const record = Record.fromJson({
        uri: repostRecord.uri,
        cid: repostRecord.cid,
        json: repostRecord.json,
        indexedAt: new Date(),
      });

      // act
      await repostIndexer.upsert({ ctx, record, depth: 0 });

      // assert
      const [repost] = await ctx.db
        .select()
        .from(schema.reposts)
        .where(eq(schema.reposts.uri, record.uri.toString()))
        .limit(1);
      expect(repost).toMatchObject({
        actorDid: reposter.did,
        subjectUri,
      });

      const [feedItem] = await ctx.db
        .select()
        .from(schema.feedItems)
        .where(eq(schema.feedItems.uri, record.uri.toString()))
        .limit(1);
      expect(feedItem).toMatchObject({
        uri: record.uri.toString(),
        type: "repost",
        actorDid: reposter.did,
        subjectUri,
      });

      expect(mockJobQueue.add).toHaveBeenCalledWith({
        queueName: "fetchRecord",
        jobName: subjectUri,
        data: {
          uri: subjectUri,
          depth: 0,
        },
      });
    });
  });

  describe("afterAction", () => {
    test("リポスト投稿の場合、対象投稿に対してrepost集計ジョブがスケジュールされる", async () => {
      // arrange
      const post = await postFactory(ctx.db).create();

      const newRepostRecord = await recordFactory(
        ctx.db,
        "app.bsky.feed.repost",
      )
        .props({
          json: () => ({
            $type: "app.bsky.feed.repost",
            subject: {
              uri: post.uri,
              cid: post.cid,
            },
            createdAt: new Date().toISOString(),
          }),
        })
        .create();

      const record = Record.fromJson({
        uri: newRepostRecord.uri,
        cid: newRepostRecord.cid,
        json: newRepostRecord.json,
        indexedAt: new Date(),
      });

      // act
      await repostIndexer.afterAction({ ctx, record });

      // assert
      expect(mockAggregatePostStatsScheduler.schedule).toHaveBeenCalledWith(
        new AtUri(post.uri),
        "repost",
      );
    });
  });
});
