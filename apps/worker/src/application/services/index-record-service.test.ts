/* eslint-disable @typescript-eslint/unbound-method */
import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import type { IJobQueue } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import { ActorRepository } from "../../infrastructure/actor-repository.js";
import { ProfileRepository } from "../../infrastructure/profile-repository.js";
import { RecordRepository } from "../../infrastructure/record-repository.js";
import { FetchRecordService } from "../services/scheduler/fetch-record-service.js";
import { ResolveDidService } from "../services/scheduler/resolve-did-service.js";
import { IndexActorService } from "./index-actor-service.js";
import { IndexRecordService } from "./index-record-service.js";
import type { FollowIndexer } from "./indexer/follow-indexer.js";
import type { LikeIndexer } from "./indexer/like-indexer.js";
import type { PostIndexer } from "./indexer/post-indexer.js";
import type { ProfileIndexer } from "./indexer/profile-indexer.js";
import type { RepostIndexer } from "./indexer/repost-indexer.js";
import type { SubscriptionIndexer } from "./indexer/subscription-indexer.js";

let indexRecordService: IndexRecordService;
let ctx: TransactionContext;

// 各種indexerをモック
const postIndexer = mockDeep<PostIndexer>();
const profileIndexer = mockDeep<ProfileIndexer>();
const followIndexer = mockDeep<FollowIndexer>();
const likeIndexer = mockDeep<LikeIndexer>();
const repostIndexer = mockDeep<RepostIndexer>();
const subscriptionIndexer = mockDeep<SubscriptionIndexer>();
const jobLogger = { log: vi.fn() };

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  ctx = testSetup.ctx;

  // IndexRecordServiceを作成
  indexRecordService = testSetup.testInjector
    .provideValue("jobQueue", mockDeep<IJobQueue>())
    .provideClass("recordRepository", RecordRepository)
    .provideClass("actorRepository", ActorRepository)
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("fetchRecordService", FetchRecordService)
    .provideClass("resolveDidService", ResolveDidService)
    .provideClass("indexActorService", IndexActorService)
    .provideValue("postIndexer", postIndexer)
    .provideValue("profileIndexer", profileIndexer)
    .provideValue("followIndexer", followIndexer)
    .provideValue("likeIndexer", likeIndexer)
    .provideValue("repostIndexer", repostIndexer)
    .provideValue("subscriptionIndexer", subscriptionIndexer)
    .injectClass(IndexRecordService);
});

describe("IndexRecordService", () => {
  describe("upsert", () => {
    it("サポートされていないコレクションの場合、エラーを投げる", async () => {
      // Arrange
      const record = Record.fromJson({
        uri: "at://did:plc:user/unsupported.collection/123",
        cid: "cid123",
        json: {
          $type: "unsupported.collection",
          text: "Hello",
        },
      });

      // Act & Assert
      await expect(
        indexRecordService.upsert({ ctx, record, jobLogger }),
      ).rejects.toThrow("Unsupported collection: unsupported.collection");
    });

    it("無効なレコード（null文字を含む）の場合、ログを記録して処理を終了する", async () => {
      // Arrange
      const record = Record.fromJson({
        uri: "at://did:plc:user/app.bsky.feed.post/123",
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello\u0000World",
        },
      });

      // Act
      await indexRecordService.upsert({ ctx, record, jobLogger });

      // Assert
      expect(jobLogger.log).toHaveBeenCalledWith(
        "Invalid record: null character found",
      );
      expect(postIndexer.shouldIndex).not.toHaveBeenCalled();
    });

    it("保存条件を満たさない場合、ログを記録して処理を終了する", async () => {
      // Arrange
      const record = Record.fromJson({
        uri: "at://did:plc:user/app.bsky.feed.post/123",
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello World",
        },
      });
      postIndexer.shouldIndex.mockResolvedValue(false);

      // Act
      await indexRecordService.upsert({ ctx, record, jobLogger });

      // Assert
      expect(jobLogger.log).toHaveBeenCalledWith(
        "Record does not match storage rules, skipping",
      );
      expect(postIndexer.upsert).not.toHaveBeenCalled();
    });

    it("投稿レコードの保存条件を満たす場合、正しく保存する", async () => {
      // Arrange
      const record = Record.fromJson({
        uri: "at://did:plc:user/app.bsky.feed.post/123",
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello World",
          createdAt: new Date().toISOString(),
        },
      });
      postIndexer.shouldIndex.mockResolvedValue(true);

      // Act
      await indexRecordService.upsert({ ctx, record, jobLogger });

      // Assert
      expect(postIndexer.shouldIndex).toHaveBeenCalledWith({
        ctx,
        record,
      });
      expect(postIndexer.upsert).toHaveBeenCalledWith({
        ctx,
        record,
      });

      // recordsテーブルに保存されていることを確認
      const records = await ctx.db
        .select()
        .from(schema.records)
        .where(eq(schema.records.uri, record.uri.toString()))
        .limit(1);
      expect(records.length).toBe(1);
      expect(records[0]?.actorDid).toBe("did:plc:user");

      // actorsテーブルに保存されていることを確認
      const actors = await ctx.db
        .select()
        .from(schema.actors)
        .where(eq(schema.actors.did, "did:plc:user"))
        .limit(1);
      expect(actors.length).toBe(1);
      expect(actors[0]?.did).toBe("did:plc:user");
    });

    it("プロフィールレコードの保存条件を満たす場合、正しく保存する", async () => {
      // Arrange
      const record = Record.fromJson({
        uri: "at://did:plc:user/app.bsky.actor.profile/self",
        cid: "cid123",
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Test User",
        },
      });
      profileIndexer.shouldIndex.mockResolvedValue(true);

      // Act
      await indexRecordService.upsert({ ctx, record, jobLogger });

      // Assert
      expect(profileIndexer.shouldIndex).toHaveBeenCalledWith({
        ctx,
        record,
      });
      expect(profileIndexer.upsert).toHaveBeenCalledWith({
        ctx,
        record,
      });
    });

    it("フォローレコードの保存条件を満たす場合、正しく保存する", async () => {
      // Arrange
      const record = Record.fromJson({
        uri: "at://did:plc:user/app.bsky.graph.follow/123",
        cid: "cid123",
        json: {
          $type: "app.bsky.graph.follow",
          subject: "did:plc:target",
          createdAt: new Date().toISOString(),
        },
      });
      followIndexer.shouldIndex.mockResolvedValue(true);

      // Act
      await indexRecordService.upsert({ ctx, record, jobLogger });

      // Assert
      expect(followIndexer.shouldIndex).toHaveBeenCalledWith({
        ctx,
        record,
      });
      expect(followIndexer.upsert).toHaveBeenCalledWith({
        ctx,
        record,
      });
    });

    it("いいねレコードの保存条件を満たす場合、正しく保存する", async () => {
      // Arrange
      const record = Record.fromJson({
        uri: "at://did:plc:user/app.bsky.feed.like/123",
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: "at://did:plc:target/app.bsky.feed.post/123",
            cid: "postcid123",
          },
          createdAt: new Date().toISOString(),
        },
      });
      likeIndexer.shouldIndex.mockResolvedValue(true);

      // Act
      await indexRecordService.upsert({ ctx, record, jobLogger });

      // Assert
      expect(likeIndexer.shouldIndex).toHaveBeenCalledWith({
        ctx,
        record,
      });
      expect(likeIndexer.upsert).toHaveBeenCalledWith({
        ctx,
        record,
      });
    });

    it("リポストレコードの保存条件を満たす場合、正しく保存する", async () => {
      // Arrange
      const record = Record.fromJson({
        uri: "at://did:plc:user/app.bsky.feed.repost/123",
        cid: "cid123",
        json: {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: "at://did:plc:target/app.bsky.feed.post/123",
            cid: "postcid123",
          },
          createdAt: new Date().toISOString(),
        },
      });
      repostIndexer.shouldIndex.mockResolvedValue(true);

      // Act
      await indexRecordService.upsert({ ctx, record, jobLogger });

      // Assert
      expect(repostIndexer.shouldIndex).toHaveBeenCalledWith({
        ctx,
        record,
      });
      expect(repostIndexer.upsert).toHaveBeenCalledWith({
        ctx,
        record,
      });
    });

    it("サブスクリプションレコードの保存条件を満たす場合、正しく保存する", async () => {
      // Arrange
      const record = Record.fromJson({
        uri: "at://did:plc:user/dev.mkizka.test.subscription/123",
        cid: "cid123",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:api.bsky.app#bsky_appview",
          createdAt: new Date().toISOString(),
        },
      });
      subscriptionIndexer.shouldIndex.mockResolvedValue(true);

      // Act
      await indexRecordService.upsert({ ctx, record, jobLogger });

      // Assert
      expect(subscriptionIndexer.shouldIndex).toHaveBeenCalledWith({
        ctx,
        record,
      });
      expect(subscriptionIndexer.upsert).toHaveBeenCalledWith({
        ctx,
        record,
      });
    });
  });

  describe("delete", () => {
    it("レコードを正しく削除する", async () => {
      // Arrange
      const uri = "at://did:plc:deleteuser/app.bsky.feed.post/delete-test";
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:deleteuser",
        handle: "deleteuser.bsky.social",
      });
      await ctx.db.insert(schema.records).values({
        uri,
        cid: "cid123",
        actorDid: "did:plc:deleteuser",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello World",
        },
      });

      // Act
      await indexRecordService.delete({ ctx, uri: AtUri.make(uri) });

      // Assert
      const records = await ctx.db
        .select()
        .from(schema.records)
        .where(eq(schema.records.uri, uri))
        .limit(1);
      expect(records.length).toBe(0);
    });
  });
});
