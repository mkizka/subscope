import type { TransactionContext } from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { setupTestDatabase } from "@dawn/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { FollowRepository } from "../../infrastructure/follow-repository.js";
import { SubscriptionRepository } from "../../infrastructure/subscription-repository.js";
import { IndexFollowService } from "./index-follow-service.js";

let indexFollowService: IndexFollowService;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  indexFollowService = testSetup.testInjector
    .provideClass("followRepository", FollowRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(IndexFollowService);
  ctx = testSetup.ctx;
});

describe("IndexFollowService", () => {
  describe("upsert", () => {
    it("フォローレコードを正しく保存する", async () => {
      // Arrange
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


  });

  describe("shouldSave", () => {
    it("フォロワーがsubscriberの場合、trueを返す", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:shouldsave-follower1",
          handle: "shouldsave-follower1.bsky.social",
        },
        {
          did: "did:plc:shouldsave-followee1",
          handle: "shouldsave-followee1.bsky.social",
        },
      ]);
      
      // フォロワーをsubscriberとして登録
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:shouldsave-follower1/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:shouldsave-follower1",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:api.dawn.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:shouldsave-follower1/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:shouldsave-follower1",
        appviewDid: "did:web:api.dawn.test",
        createdAt: new Date(),
      });
      
      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:shouldsave-followee1",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:shouldsave-follower1/app.bsky.graph.follow/123",
        cid: "follow123",
        json: followJson,
      });

      // Act
      const result = await indexFollowService.shouldSave({ ctx, record });

      // Assert
      expect(result).toBe(true);
    });


    it("フォロイーがsubscriberの場合、trueを返す", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:shouldsave-follower2",
          handle: "shouldsave-follower2.bsky.social",
        },
        {
          did: "did:plc:shouldsave-followee2",
          handle: "shouldsave-followee2.bsky.social",
        },
      ]);
      
      // フォロイーをsubscriberとして登録
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:shouldsave-followee2/dev.mkizka.test.subscription/456",
        cid: "sub456",
        actorDid: "did:plc:shouldsave-followee2",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:api.dawn.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:shouldsave-followee2/dev.mkizka.test.subscription/456",
        cid: "sub456",
        actorDid: "did:plc:shouldsave-followee2",
        appviewDid: "did:web:api.dawn.test",
        createdAt: new Date(),
      });
      
      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:shouldsave-followee2",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:shouldsave-follower2/app.bsky.graph.follow/456",
        cid: "follow456",
        json: followJson,
      });

      // Act
      const result = await indexFollowService.shouldSave({ ctx, record });

      // Assert
      expect(result).toBe(true);
    });


    it("フォロワーもフォロイーもsubscriberでない場合、falseを返す", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:shouldsave-follower3",
          handle: "shouldsave-follower3.bsky.social",
        },
        {
          did: "did:plc:shouldsave-followee3",
          handle: "shouldsave-followee3.bsky.social",
        },
      ]);
      
      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:shouldsave-followee3",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:shouldsave-follower3/app.bsky.graph.follow/789",
        cid: "follow789",
        json: followJson,
      });

      // Act
      const result = await indexFollowService.shouldSave({ ctx, record });

      // Assert
      expect(result).toBe(false);
    });
  });
});
