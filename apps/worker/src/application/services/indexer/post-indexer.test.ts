/* eslint-disable @typescript-eslint/unbound-method */
import { AtUri } from "@atproto/syntax";
import type { IJobQueue } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  actorFactory,
  postFactory,
  randomCid,
  recordFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";
import { mock, mockDeep } from "vitest-mock-extended";

import { PostIndexingPolicy } from "../../../domain/post-indexing-policy.js";
import { ActorStatsRepository } from "../../../infrastructure/repositories/actor-stats-repository.js";
import { FeedItemRepository } from "../../../infrastructure/repositories/feed-item-repository.js";
import { PostRepository } from "../../../infrastructure/repositories/post-repository/post-repository.js";
import { PostgresIndexTargetRepository } from "../../../infrastructure/repositories/postgres-index-target-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/repositories/subscription-repository.js";
import { TrackedActorChecker } from "../../../infrastructure/repositories/tracked-actor-checker.js";
import type { AggregateActorStatsScheduler } from "../scheduler/aggregate-actor-stats-scheduler.js";
import type { AggregatePostStatsScheduler } from "../scheduler/aggregate-post-stats-scheduler.js";
import { FetchRecordScheduler } from "../scheduler/fetch-record-scheduler.js";
import { PostIndexer } from "./post-indexer.js";

describe("PostIndexer", () => {
  const mockAggregatePostStatsScheduler = mock<AggregatePostStatsScheduler>();
  const mockAggregateActorStatsScheduler = mock<AggregateActorStatsScheduler>();
  const mockJobQueue = mockDeep<IJobQueue>();
  const { testInjector, ctx } = testSetup;

  const postIndexer = testInjector
    .provideClass("postRepository", PostRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("trackedActorChecker", TrackedActorChecker)
    .provideClass("indexTargetRepository", PostgresIndexTargetRepository)
    .provideClass("postIndexingPolicy", PostIndexingPolicy)
    .provideClass("feedItemRepository", FeedItemRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideValue(
      "aggregatePostStatsScheduler",
      mockAggregatePostStatsScheduler,
    )
    .provideValue(
      "aggregateActorStatsScheduler",
      mockAggregateActorStatsScheduler,
    )
    .provideValue("jobQueue", mockJobQueue)
    .provideClass("fetchRecordScheduler", FetchRecordScheduler)
    .injectClass(PostIndexer);

  describe("upsert", () => {
    test("subscriberの投稿は実際にDBに保存される", async () => {
      // arrange
      const subscriber = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriber })
        .create();

      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post",
        createdAt: new Date().toISOString(),
      };
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => subscriber })
        .props({ json: () => postJson })
        .create();
      const record = Record.fromJson({
        uri: postRecord.uri,
        cid: postRecord.cid,
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });

      // assert
      const [post] = await ctx.db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.uri, record.uri.toString()))
        .limit(1);
      expect(post).toBeDefined();

      const [feedItem] = await ctx.db
        .select()
        .from(schema.feedItems)
        .where(eq(schema.feedItems.uri, record.uri.toString()))
        .limit(1);
      expect(feedItem).toMatchObject({
        uri: record.uri.toString(),
        type: "post",
        actorDid: subscriber.did,
        subjectUri: null,
      });
    });

    test("embedにレコードが含まれる場合、fetchRecordジョブが追加される", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const embedCid = await randomCid();
      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post with embed",
        embed: {
          $type: "app.bsky.embed.record",
          record: {
            uri: "at://did:plc:embeduser/app.bsky.feed.post/embedpost",
            cid: embedCid,
          },
        },
        createdAt: new Date().toISOString(),
      };
      const recordData = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .props({ json: () => postJson })
        .create();
      const record = Record.fromJson({
        uri: recordData.uri,
        cid: recordData.cid,
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });

      // assert
      expect(mockJobQueue.add).toHaveBeenCalledTimes(1);
      expect(mockJobQueue.add).toHaveBeenCalledWith({
        queueName: "fetchRecord",
        jobName: "at://did:plc:embeduser/app.bsky.feed.post/embedpost",
        data: {
          uri: "at://did:plc:embeduser/app.bsky.feed.post/embedpost",
          depth: 0,
        },
      });
    });

    test("embedがない場合、fetchRecordジョブは追加されない", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post without embed",
        createdAt: new Date().toISOString(),
      };
      const recordData = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .props({ json: () => postJson })
        .create();
      const record = Record.fromJson({
        uri: recordData.uri,
        cid: recordData.cid,
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });

      // assert
      expect(mockJobQueue.add).not.toHaveBeenCalled();
    });

    test("無効な日付（0000-01-01）の投稿でもエラーなく保存される", async () => {
      // arrange
      const subscriber = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriber })
        .create();

      const postJson = {
        $type: "app.bsky.feed.post",
        text: "投稿に無効な日付が含まれている",
        createdAt: "0000-01-01T00:00:00.000Z",
      };
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => subscriber })
        .props({ json: () => postJson })
        .create();
      const record = Record.fromJson({
        uri: postRecord.uri,
        cid: postRecord.cid,
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });

      // assert
      const [post] = await ctx.db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.uri, record.uri.toString()))
        .limit(1);
      expect(post?.createdAt).toEqual(new Date(0));

      const [feedItem] = await ctx.db
        .select()
        .from(schema.feedItems)
        .where(eq(schema.feedItems.uri, record.uri.toString()))
        .limit(1);
      expect(feedItem?.sortAt).toEqual(new Date(0));
    });
  });

  describe("afterAction", () => {
    test("投稿時にpost_statsとactorの投稿数の集計がスケジュールされる", async () => {
      // arrange
      const regularActor = await actorFactory(ctx.db).create();
      const postJson = {
        $type: "app.bsky.feed.post",
        text: "Regular post without reply",
        createdAt: new Date().toISOString(),
      };
      const regularRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => regularActor })
        .props({ json: () => postJson })
        .create();
      const record = Record.fromJson({
        uri: regularRecord.uri,
        cid: regularRecord.cid,
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });
      await postIndexer.afterAction({ action: "upsert", ctx, record });

      // assert
      expect(mockAggregateActorStatsScheduler.schedule).toHaveBeenCalledWith(
        regularActor.did,
        "posts",
      );
      expect(mockAggregatePostStatsScheduler.schedule).toHaveBeenCalledWith(
        new AtUri(record.uri.toString()),
        "all",
      );
    });

    test("リプライの場合、親投稿に対してreply集計ジョブがスケジュールされる", async () => {
      // arrange
      const parentActor = await actorFactory(ctx.db).create();
      const parentRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => parentActor })
        .create();
      const parentPost = await postFactory(ctx.db)
        .vars({ record: () => parentRecord })
        .props({
          text: () => "Parent post",
        })
        .create();

      const replier = await actorFactory(ctx.db).create();
      const replyJson = {
        $type: "app.bsky.feed.post",
        text: "New reply",
        reply: {
          root: {
            uri: parentPost.uri,
            cid: parentPost.cid,
          },
          parent: {
            uri: parentPost.uri,
            cid: parentPost.cid,
          },
        },
        createdAt: new Date().toISOString(),
      };
      const newReplyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => replier })
        .props({ json: () => replyJson })
        .create();
      const record = Record.fromJson({
        uri: newReplyRecord.uri,
        cid: newReplyRecord.cid,
        json: replyJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });
      await postIndexer.afterAction({ action: "upsert", ctx, record });

      // assert
      expect(mockAggregateActorStatsScheduler.schedule).toHaveBeenCalledWith(
        replier.did,
        "posts",
      );
      expect(mockAggregatePostStatsScheduler.schedule).toHaveBeenCalledWith(
        new AtUri(parentPost.uri),
        "reply",
      );
    });

    test("引用投稿の場合、quote集計ジョブがスケジュールされる", async () => {
      // arrange
      const quotedPost = await postFactory(ctx.db).create();
      const quotingActor = await actorFactory(ctx.db).create();
      const quoteJson = {
        $type: "app.bsky.feed.post",
        text: "This is a quote post",
        embed: {
          $type: "app.bsky.embed.record",
          record: {
            uri: quotedPost.uri,
            cid: quotedPost.cid,
          },
        },
        createdAt: new Date().toISOString(),
      };
      const newQuoteRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => quotingActor })
        .props({ json: () => quoteJson })
        .create();
      const record = Record.fromJson({
        uri: newQuoteRecord.uri,
        cid: newQuoteRecord.cid,
        json: quoteJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });
      await postIndexer.afterAction({ action: "upsert", ctx, record });

      // assert
      expect(mockAggregatePostStatsScheduler.schedule).toHaveBeenCalledWith(
        new AtUri(quotedPost.uri),
        "quote",
      );
    });

    test("親投稿が存在しない場合は親投稿に対する集計ジョブをスケジュールしない", async () => {
      // arrange
      const replierActor = await actorFactory(ctx.db).create();
      const nonExistentParentUri =
        "at://did:plc:nonexistent/app.bsky.feed.post/parent";
      const nonExistentParentCid =
        "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e";
      const replyJson = {
        $type: "app.bsky.feed.post",
        text: "Reply to non-existent post",
        reply: {
          root: {
            uri: nonExistentParentUri,
            cid: nonExistentParentCid,
          },
          parent: {
            uri: nonExistentParentUri,
            cid: nonExistentParentCid,
          },
        },
        createdAt: new Date().toISOString(),
      };
      const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => replierActor })
        .props({ json: () => replyJson })
        .create();
      const record = Record.fromJson({
        uri: replyRecord.uri,
        cid: replyRecord.cid,
        json: replyJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });
      await postIndexer.afterAction({ action: "upsert", ctx, record });

      // assert
      expect(mockAggregateActorStatsScheduler.schedule).toHaveBeenCalledWith(
        replierActor.did,
        "posts",
      );
      expect(mockAggregatePostStatsScheduler.schedule).not.toHaveBeenCalledWith(
        nonExistentParentUri,
        "reply",
      );
    });

    test("投稿の削除時に呼ばれたafterActioの場合、post_statsは更新しないがactor_statsは更新する", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postJson = {
        $type: "app.bsky.feed.post",
        text: "Post that will be deleted",
        createdAt: new Date().toISOString(),
      };
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .props({ json: () => postJson })
        .create();

      // postを作成
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();

      // postを削除（実際の削除処理をシミュレート）
      await ctx.db.delete(schema.posts).where(eq(schema.posts.uri, post.uri));

      const record = Record.fromJson({
        uri: postRecord.uri,
        cid: postRecord.cid,
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.afterAction({ action: "delete", ctx, record });

      // assert
      expect(mockAggregatePostStatsScheduler.schedule).not.toHaveBeenCalled();
      expect(mockAggregateActorStatsScheduler.schedule).toHaveBeenCalledWith(
        actor.did,
        "posts",
      );
    });
  });
});
