import type { TransactionContext } from "@repo/common/domain";
import { Record, Repost } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

import { SubscriptionRepository } from "../../infrastructure/subscription-repository.js";
import { RepostIndexingPolicy } from "./repost-indexing-policy.js";

let repostIndexingPolicy: RepostIndexingPolicy;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  repostIndexingPolicy = testSetup.testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(RepostIndexingPolicy);
  ctx = testSetup.ctx;
});

describe("RepostIndexingPolicy", () => {
  describe("shouldIndex", () => {
    it("repost者がsubscriberの場合は保存すべき", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:reposter",
          handle: "reposter.bsky.social",
        },
        {
          did: "did:plc:author",
          handle: "author.bsky.social",
        },
      ]);

      // repost者をsubscriberとして登録
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:reposter/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:reposter",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:appview.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:reposter/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:reposter",
        appviewDid: "did:web:appview.test",
        createdAt: new Date(),
      });

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: "at://did:plc:author/app.bsky.feed.post/456",
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:reposter/app.bsky.feed.repost/123",
        cid: "repost123",
        json: repostJson,
      });

      // Act
      const result = await repostIndexingPolicy.shouldIndex(
        ctx,
        Repost.from(record),
      );

      // Assert
      expect(result).toBe(true);
    });

    it("repost者のフォロワーがsubscriberの場合は保存すべき", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:reposter2",
          handle: "reposter2.bsky.social",
        },
        {
          did: "did:plc:follower",
          handle: "follower.bsky.social",
        },
        {
          did: "did:plc:author2",
          handle: "author2.bsky.social",
        },
      ]);

      // フォロワーをsubscriberとして登録
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:follower/dev.mkizka.test.subscription/789",
        cid: "sub789",
        actorDid: "did:plc:follower",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:appview.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:follower/dev.mkizka.test.subscription/789",
        cid: "sub789",
        actorDid: "did:plc:follower",
        appviewDid: "did:web:appview.test",
        createdAt: new Date(),
      });

      // フォローレコード作成
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:follower/app.bsky.graph.follow/987",
        cid: "follow987",
        actorDid: "did:plc:follower",
        json: {
          $type: "app.bsky.graph.follow",
          subject: "did:plc:reposter2",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.follows).values({
        uri: "at://did:plc:follower/app.bsky.graph.follow/987",
        cid: "follow987",
        actorDid: "did:plc:follower",
        subjectDid: "did:plc:reposter2",
        createdAt: new Date(),
      });

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: "at://did:plc:author2/app.bsky.feed.post/654",
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:reposter2/app.bsky.feed.repost/321",
        cid: "repost321",
        json: repostJson,
      });

      // Act
      const result = await repostIndexingPolicy.shouldIndex(
        ctx,
        Repost.from(record),
      );

      // Assert
      expect(result).toBe(true);
    });

    it("repost者もフォロワーもsubscriberでない場合は保存すべきでない", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:unrelated-reposter",
          handle: "unrelated-reposter.bsky.social",
        },
        {
          did: "did:plc:unrelated-author",
          handle: "unrelated-author.bsky.social",
        },
      ]);

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: "at://did:plc:unrelated-author/app.bsky.feed.post/999",
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:unrelated-reposter/app.bsky.feed.repost/888",
        cid: "repost888",
        json: repostJson,
      });

      // Act
      const result = await repostIndexingPolicy.shouldIndex(
        ctx,
        Repost.from(record),
      );

      // Assert
      expect(result).toBe(false);
    });
  });
});
