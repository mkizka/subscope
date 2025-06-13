import type { TransactionContext } from "@repo/common/domain";
import { Follow, Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

import { SubscriptionRepository } from "../../infrastructure/subscription-repository.js";
import { FollowIndexingPolicy } from "./follow-indexing-policy.js";

let followIndexingPolicy: FollowIndexingPolicy;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  followIndexingPolicy = testSetup.testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(FollowIndexingPolicy);
  ctx = testSetup.ctx;
});

describe("FollowIndexingPolicy", () => {
  describe("shouldIndex", () => {
    it("フォロワーがsubscriberの場合は保存すべき", async () => {
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

      // フォロワーをsubscriberとして登録
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:follower/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:follower",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:appview.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:follower/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:follower",
        appviewDid: "did:web:appview.test",
        createdAt: new Date(),
      });

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:followee",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:follower/app.bsky.graph.follow/123",
        cid: "follow123",
        json: followJson,
      });

      // Act
      const result = await followIndexingPolicy.shouldIndex(ctx, Follow.from(record));

      // Assert
      expect(result).toBe(true);
    });

    it("フォロイーがsubscriberの場合は保存すべき", async () => {
      // Arrange
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
        uri: "at://did:plc:followee2/dev.mkizka.test.subscription/456",
        cid: "sub456",
        actorDid: "did:plc:followee2",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:appview.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:followee2/dev.mkizka.test.subscription/456",
        cid: "sub456",
        actorDid: "did:plc:followee2",
        appviewDid: "did:web:appview.test",
        createdAt: new Date(),
      });

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:followee2",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:follower2/app.bsky.graph.follow/456",
        cid: "follow456",
        json: followJson,
      });

      // Act
      const result = await followIndexingPolicy.shouldIndex(ctx, Follow.from(record));

      // Assert
      expect(result).toBe(true);
    });

    it("フォロワーもフォロイーもsubscriberでない場合は保存すべきでない", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:unrelated-follower",
          handle: "unrelated-follower.bsky.social",
        },
        {
          did: "did:plc:unrelated-followee",
          handle: "unrelated-followee.bsky.social",
        },
      ]);

      const followJson = {
        $type: "app.bsky.graph.follow",
        subject: "did:plc:unrelated-followee",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:unrelated-follower/app.bsky.graph.follow/789",
        cid: "follow789",
        json: followJson,
      });

      // Act
      const result = await followIndexingPolicy.shouldIndex(ctx, Follow.from(record));

      // Assert
      expect(result).toBe(false);
    });
  });
});