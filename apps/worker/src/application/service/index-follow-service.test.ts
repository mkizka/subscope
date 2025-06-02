import { Record } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { setupTestDatabase } from "@dawn/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { FollowRepository } from "../../infrastructure/follow-repository.js";
import { SubscriptionRepository } from "../../infrastructure/subscription-repository.js";
import { IndexFollowService } from "./index-follow-service.js";

const { getSetup } = setupTestDatabase();

describe("IndexFollowService", () => {
  describe("upsert", () => {
    it("フォロワーがsubscriberの場合、フォローレコードが保存される", async () => {
      // Arrange
      const { testInjector, ctx } = getSetup();
      const indexFollowService = testInjector
        .provideClass("followRepository", FollowRepository)
        .provideClass("subscriptionRepository", SubscriptionRepository)
        .injectClass(IndexFollowService);
      // フォロワー（subscriber）とフォロイーのactor情報を準備
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:follower",
          handle: "follower.bsky.social",
        },
        {
          did: "did:plc:followee",
          handle: "followee.bsky.social",
        },
      ]);
      // フォロワーをsubscriberとして登録
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:follower/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:follower",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:api.dawn.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:follower/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:follower",
        appviewDid: "did:web:api.dawn.test",
        createdAt: new Date(),
      });
      // フォローレコード用のrecordsテーブルエントリ
      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:followee",
        createdAt: new Date().toISOString(),
      };
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:follower/app.bsky.graph.follow/123",
        cid: "follow123",
        actorDid: "did:plc:follower",
        json: followJson,
      });
      const record = Record.fromJson({
        uri: "at://did:plc:follower/app.bsky.graph.follow/123",
        cid: "follow123",
        json: followJson,
      });

      // Act
      await indexFollowService.upsert({ ctx, record });

      // Assert
      const follows = await ctx.db
        .select()
        .from(schema.follows)
        .where(eq(schema.follows.uri, record.uri.toString()))
        .limit(1);
      expect(follows.length).toBe(1);
      expect(follows[0]?.actorDid).toBe("did:plc:follower");
      expect(follows[0]?.subjectDid).toBe("did:plc:followee");
    });


    it("フォロイーがsubscriberの場合、フォローレコードが保存される", async () => {
      // Arrange
      const { testInjector, ctx } = getSetup();
      const indexFollowService = testInjector
        .provideClass("followRepository", FollowRepository)
        .provideClass("subscriptionRepository", SubscriptionRepository)
        .injectClass(IndexFollowService);
      // フォロワーとフォロイー（subscriber）のactor情報を準備
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:follower2",
          handle: "follower2.bsky.social",
        },
        {
          did: "did:plc:followee2",
          handle: "followee2.bsky.social",
        },
      ]);
      // フォロイーをsubscriberとして登録
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:followee2/dev.mkizka.test.subscription/123",
        cid: "sub456",
        actorDid: "did:plc:followee2",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:api.dawn.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:followee2/dev.mkizka.test.subscription/123",
        cid: "sub456",
        actorDid: "did:plc:followee2",
        appviewDid: "did:web:api.dawn.test",
        createdAt: new Date(),
      });
      // フォローレコード用のrecordsテーブルエントリ
      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:followee2",
        createdAt: new Date().toISOString(),
      };
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:follower2/app.bsky.graph.follow/456",
        cid: "follow456",
        actorDid: "did:plc:follower2",
        json: followJson,
      });
      const record = Record.fromJson({
        uri: "at://did:plc:follower2/app.bsky.graph.follow/456",
        cid: "follow456",
        json: followJson,
      });

      // Act
      await indexFollowService.upsert({ ctx, record });

      // Assert
      const follows = await ctx.db
        .select()
        .from(schema.follows)
        .where(eq(schema.follows.uri, record.uri.toString()))
        .limit(1);
      expect(follows.length).toBe(1);
      expect(follows[0]?.actorDid).toBe("did:plc:follower2");
      expect(follows[0]?.subjectDid).toBe("did:plc:followee2");
    });


    it("フォロワーもフォロイーもsubscriberでない場合、フォローレコードは保存されない", async () => {
      // Arrange
      const { testInjector, ctx } = getSetup();
      const indexFollowService = testInjector
        .provideClass("followRepository", FollowRepository)
        .provideClass("subscriptionRepository", SubscriptionRepository)
        .injectClass(IndexFollowService);
      // フォロワーとフォロイーのactor情報を準備（どちらもsubscriberではない）
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:follower3",
          handle: "follower3.bsky.social",
        },
        {
          did: "did:plc:followee3",
          handle: "followee3.bsky.social",
        },
      ]);
      // フォローレコード用のrecordsテーブルエントリ
      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:followee3",
        createdAt: new Date().toISOString(),
      };
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:follower3/app.bsky.graph.follow/789",
        cid: "follow789",
        actorDid: "did:plc:follower3",
        json: followJson,
      });
      const record = Record.fromJson({
        uri: "at://did:plc:follower3/app.bsky.graph.follow/789",
        cid: "follow789",
        json: followJson,
      });

      // Act
      await indexFollowService.upsert({ ctx, record });

      // Assert
      const follows = await ctx.db
        .select()
        .from(schema.follows)
        .where(eq(schema.follows.uri, record.uri.toString()))
        .limit(1);
      expect(follows.length).toBe(0);
    });
  });
});