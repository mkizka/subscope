import type { TransactionContext } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { LikeIndexingPolicy } from "../../../domain/like-indexing-policy.js";
import { LikeRepository } from "../../../infrastructure/like-repository.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { LikeIndexer } from "./like-indexer.js";

let likeIndexer: LikeIndexer;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  likeIndexer = testSetup.testInjector
    .provideClass("likeRepository", LikeRepository)
    .provideClass("postRepository", PostRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("likeIndexingPolicy", LikeIndexingPolicy)
    .injectClass(LikeIndexer);
  ctx = testSetup.ctx;
});

describe("LikeIndexer", () => {
  describe("upsert", () => {
    it("subscriberのいいねは実際にDBに保存される", async () => {
      // Arrange
      // subscriberとしてactor情報を準備
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:subscriber",
        handle: "subscriber.bsky.social",
      });
      // subscriptionレコード用のrecordsテーブルエントリ
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:subscriber/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:subscriber",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:appview.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:subscriber/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:subscriber",
        appviewDid: "did:web:appview.test",
        createdAt: new Date(),
      });

      // いいねレコード用のrecordsテーブルエントリ
      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: "at://did:plc:other/app.bsky.feed.post/123",
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        },
        createdAt: new Date().toISOString(),
      };
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:subscriber/app.bsky.feed.like/123",
        cid: "abc123",
        actorDid: "did:plc:subscriber",
        json: likeJson,
      });
      const record = Record.fromJson({
        uri: "at://did:plc:subscriber/app.bsky.feed.like/123",
        cid: "abc123",
        json: likeJson,
      });

      // Act
      await likeIndexer.upsert({ ctx, record });

      // Assert
      const [like] = await ctx.db
        .select()
        .from(schema.likes)
        .where(eq(schema.likes.uri, record.uri.toString()))
        .limit(1);
      expect(like).toBeDefined();
    });
  });
});
