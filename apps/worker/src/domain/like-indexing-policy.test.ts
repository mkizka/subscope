import type { TransactionContext } from "@repo/common/domain";
import { Like, Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

import { PostRepository } from "../infrastructure/post-repository.js";
import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { LikeIndexingPolicy } from "./like-indexing-policy.js";

let likeIndexingPolicy: LikeIndexingPolicy;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  likeIndexingPolicy = testSetup.testInjector
    .provideClass("postRepository", PostRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(LikeIndexingPolicy);
  ctx = testSetup.ctx;
});

describe("LikeIndexingPolicy", () => {
  describe("shouldIndex", () => {
    it("subscriberのいいねは保存すべき", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:subscriber",
        handle: "subscriber.bsky.social",
      });
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

      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: "at://did:plc:other/app.bsky.feed.post/123",
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:subscriber/app.bsky.feed.like/123",
        cid: "abc123",
        json: likeJson,
      });

      // Act
      const result = await likeIndexingPolicy.shouldIndex(
        ctx,
        Like.from(record),
      );

      // Assert
      expect(result).toBe(true);
    });

    it("DBに存在する投稿へのいいねは保存すべき", async () => {
      // Arrange
      // いいねするactor（subscriberではない）
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:liker",
        handle: "liker.bsky.social",
      });

      // いいねされる投稿のactor
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:poster",
        handle: "poster.bsky.social",
      });
      const postUri = "at://did:plc:poster/app.bsky.feed.post/original";
      await ctx.db.insert(schema.records).values({
        uri: postUri,
        cid: "bafyreihml5hpzt7wajfixoystmq6vttmtigdsupjrvajqkauyiuozp3r7m",
        actorDid: "did:plc:poster",
        json: {
          $type: "app.bsky.feed.post",
          text: "original post",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.posts).values({
        uri: postUri,
        cid: "bafyreihml5hpzt7wajfixoystmq6vttmtigdsupjrvajqkauyiuozp3r7m",
        actorDid: "did:plc:poster",
        text: "original post",
        createdAt: new Date(),
      });

      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: postUri,
          cid: "bafyreihml5hpzt7wajfixoystmq6vttmtigdsupjrvajqkauyiuozp3r7m",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:liker/app.bsky.feed.like/123",
        cid: "like123",
        json: likeJson,
      });

      // Act
      const result = await likeIndexingPolicy.shouldIndex(
        ctx,
        Like.from(record),
      );

      // Assert
      expect(result).toBe(true);
    });

    it("subscriberでもなく、DBに存在しない投稿へのいいねは保存すべきでない", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:unrelated",
        handle: "unrelated.bsky.social",
      });

      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: "at://did:plc:ghost/app.bsky.feed.post/ghost123",
          cid: "bafyreigdcnwvpvpvp2u63ysxt4jkdvjmvzqxjvnwonhsqvlbcvfqhqfvfi",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:unrelated/app.bsky.feed.like/123",
        cid: "like123",
        json: likeJson,
      });

      // Act
      const result = await likeIndexingPolicy.shouldIndex(
        ctx,
        Like.from(record),
      );

      // Assert
      expect(result).toBe(false);
    });
  });
});
