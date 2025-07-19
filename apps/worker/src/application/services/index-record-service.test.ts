import { AtUri } from "@atproto/syntax";
import type { IJobQueue } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import {
  actorFactory,
  getTestSetup,
  postFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { describe, expect, test, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import { FollowIndexingPolicy } from "../../domain/follow-indexing-policy.js";
import { GeneratorIndexingPolicy } from "../../domain/generator-indexing-policy.js";
import { LikeIndexingPolicy } from "../../domain/like-indexing-policy.js";
import { PostIndexingPolicy } from "../../domain/post-indexing-policy.js";
import { ProfileIndexingPolicy } from "../../domain/profile-indexing-policy.js";
import { RepostIndexingPolicy } from "../../domain/repost-indexing-policy.js";
import { SubscriptionIndexingPolicy } from "../../domain/subscription-indexing-policy.js";
import { ActorRepository } from "../../infrastructure/repositories/actor-repository.js";
import { ActorStatsRepository } from "../../infrastructure/repositories/actor-stats-repository.js";
import { FeedItemRepository } from "../../infrastructure/repositories/feed-item-repository.js";
import { FollowRepository } from "../../infrastructure/repositories/follow-repository.js";
import { GeneratorRepository } from "../../infrastructure/repositories/generator-repository.js";
import { LikeRepository } from "../../infrastructure/repositories/like-repository.js";
import { PostRepository } from "../../infrastructure/repositories/post-repository.js";
import { PostStatsRepository } from "../../infrastructure/repositories/post-stats-repository.js";
import { ProfileRepository } from "../../infrastructure/repositories/profile-repository.js";
import { RecordRepository } from "../../infrastructure/repositories/record-repository.js";
import { RepostRepository } from "../../infrastructure/repositories/repost-repository.js";
import { SubscriptionRepository } from "../../infrastructure/repositories/subscription-repository.js";
import { IndexActorService } from "./index-actor-service.js";
import { IndexRecordService } from "./index-record-service.js";
import { FollowIndexer } from "./indexer/follow-indexer.js";
import { GeneratorIndexer } from "./indexer/generator-indexer.js";
import { LikeIndexer } from "./indexer/like-indexer.js";
import { PostIndexer } from "./indexer/post-indexer.js";
import { ProfileIndexer } from "./indexer/profile-indexer.js";
import { RepostIndexer } from "./indexer/repost-indexer.js";
import { SubscriptionIndexer } from "./indexer/subscription-indexer.js";
import { BackfillScheduler } from "./scheduler/backfill-scheduler.js";
import { FetchRecordScheduler } from "./scheduler/fetch-record-scheduler.js";
import { ResolveDidScheduler } from "./scheduler/resolve-did-scheduler.js";

describe("IndexRecordService", () => {
  const { testInjector, ctx } = getTestSetup();
  const jobLogger = { log: vi.fn() };

  const indexRecordService = testInjector
    .provideValue("jobQueue", mockDeep<IJobQueue>())
    .provideValue("indexLevel", 1)
    .provideClass("actorRepository", ActorRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("postRepository", PostRepository)
    .provideClass("recordRepository", RecordRepository)
    .provideClass("followRepository", FollowRepository)
    .provideClass("generatorRepository", GeneratorRepository)
    .provideClass("likeRepository", LikeRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("repostRepository", RepostRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("feedItemRepository", FeedItemRepository)
    .provideClass("fetchRecordScheduler", FetchRecordScheduler)
    .provideClass("postIndexingPolicy", PostIndexingPolicy)
    .provideClass("likeIndexingPolicy", LikeIndexingPolicy)
    .provideClass("followIndexingPolicy", FollowIndexingPolicy)
    .provideClass("generatorIndexingPolicy", GeneratorIndexingPolicy)
    .provideClass("profileIndexingPolicy", ProfileIndexingPolicy)
    .provideClass("repostIndexingPolicy", RepostIndexingPolicy)
    .provideClass("subscriptionIndexingPolicy", SubscriptionIndexingPolicy)
    .provideClass("backfillScheduler", BackfillScheduler)
    .provideClass("resolveDidScheduler", ResolveDidScheduler)
    .provideClass("profileIndexer", ProfileIndexer)
    .provideClass("postIndexer", PostIndexer)
    .provideClass("indexActorService", IndexActorService)
    .provideClass("followIndexer", FollowIndexer)
    .provideClass("generatorIndexer", GeneratorIndexer)
    .provideClass("likeIndexer", LikeIndexer)
    .provideClass("repostIndexer", RepostIndexer)
    .provideClass("subscriptionIndexer", SubscriptionIndexer)
    .injectClass(IndexRecordService);

  describe("upsert", () => {
    test("サポートされていないコレクションの場合、エラーを投げる", async () => {
      // arrange
      const record = Record.fromJson({
        uri: "at://did:plc:user/unsupported.collection/123",
        cid: "cid123",
        json: {
          $type: "unsupported.collection",
          text: "Hello",
        },
        indexedAt: new Date(),
      });

      // act & assert
      await expect(
        indexRecordService.upsert({ ctx, record, jobLogger, depth: 0 }),
      ).rejects.toThrow("Unsupported collection: unsupported.collection");
    });

    test("無効なレコード（null文字を含む）の場合、ログを記録して処理を終了する", async () => {
      // arrange
      const record = Record.fromJson({
        uri: "at://did:plc:user/app.bsky.feed.post/123",
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello\u0000World",
        },
        indexedAt: new Date(),
      });

      // act
      await indexRecordService.upsert({ ctx, record, jobLogger, depth: 0 });

      // assert
      expect(jobLogger.log).toHaveBeenCalledWith(
        "Invalid record: null character found",
      );
    });

    test("保存条件を満たさない場合、ログを記録して処理を終了する", async () => {
      // arrange
      const record = Record.fromJson({
        uri: "at://did:plc:user/app.bsky.feed.post/123",
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello World",
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      });

      // act
      await indexRecordService.upsert({ ctx, record, jobLogger, depth: 0 });

      // assert
      expect(jobLogger.log).toHaveBeenCalledWith(
        "Record does not match storage rules, skipping",
      );
    });

    test("subscriberのフォローレコードの場合、正しく保存する", async () => {
      // arrange
      const followingActor = await actorFactory(ctx.db).create();
      const followerActor = await actorFactory(ctx.db).create();

      const subscriptionRecord = await recordFactory(
        ctx.db,
        "me.subsco.sync.subscription",
      )
        .vars({
          actor: () => followingActor,
        })
        .create();
      await subscriptionFactory(ctx.db)
        .vars({
          record: () => subscriptionRecord,
        })
        .create();

      const followRecord = Record.fromJson({
        uri: `at://${followerActor.did}/app.bsky.graph.follow/456`,
        cid: "follow-cid",
        json: {
          $type: "app.bsky.graph.follow",
          subject: followingActor.did,
          createdAt: new Date().toISOString(),
        },
        indexedAt: new Date(),
      });

      // act
      await indexRecordService.upsert({
        ctx,
        record: followRecord,
        jobLogger,
        depth: 0,
      });

      // assert
      expect(jobLogger.log).not.toHaveBeenCalledWith(
        "Record does not match storage rules, skipping",
      );
      const savedRecord = await ctx.db.query.records.findFirst({
        where: (records, { eq }) =>
          eq(records.uri, followRecord.uri.toString()),
      });
      expect(savedRecord).toMatchObject({
        uri: followRecord.uri.toString(),
        cid: followRecord.cid,
        actorDid: followerActor.did,
      });

      const savedFollow = await ctx.db.query.follows.findFirst({
        where: (follows, { eq }) =>
          eq(follows.uri, followRecord.uri.toString()),
      });
      expect(savedFollow).toMatchObject({
        uri: followRecord.uri.toString(),
        cid: followRecord.cid,
        actorDid: followerActor.did,
        subjectDid: followingActor.did,
      });
    });
  });

  describe("delete", () => {
    test("存在しないレコードの場合、何もしない", async () => {
      // arrange
      const uri = AtUri.make(
        "at://did:plc:deleteuser/app.bsky.feed.post/delete-test",
      );

      // act
      await indexRecordService.delete({ ctx, uri });

      // assert
      const record = await ctx.db.query.records.findFirst({
        where: (records, { eq }) => eq(records.uri, uri.toString()),
      });
      expect(record).toBeUndefined();
    });

    test("レコードが存在する場合、正しく削除する", async () => {
      // arrange
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .props({
          json: () => ({
            $type: "app.bsky.feed.post",
            text: "Test post for deletion",
            createdAt: new Date().toISOString(),
          }),
        })
        .create();
      const post = await postFactory(ctx.db)
        .vars({
          record: () => postRecord,
        })
        .create();

      // act
      await indexRecordService.delete({
        ctx,
        uri: new AtUri(post.uri),
      });

      // assert
      const record = await ctx.db.query.records.findFirst({
        where: (records, { eq }) => eq(records.uri, post.uri),
      });
      expect(record).toBeUndefined();
    });
  });
});
