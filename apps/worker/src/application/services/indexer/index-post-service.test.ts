import type { TransactionContext } from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { setupTestDatabase } from "@dawn/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { PostRepository } from "../../../infrastructure/post-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { IndexPostService } from "./index-post-service.js";

let indexPostService: IndexPostService;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  indexPostService = testSetup.testInjector
    .provideClass("postRepository", PostRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(IndexPostService);
  ctx = testSetup.ctx;
});

describe("IndexPostService", () => {
  describe("upsert", () => {
    it("subscriberの投稿は実際にDBに保存される", async () => {
      // Arrange
      // subscriberとしてactor情報を準備
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:123",
        handle: "test.bsky.social",
      });
      // subscriptionレコード用のrecordsテーブルエントリ
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:123/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:123",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:api.dawn.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:123/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:123",
        appviewDid: "did:web:api.dawn.test",
        createdAt: new Date(),
      });
      // 投稿レコード用のrecordsテーブルエントリ
      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post",
        createdAt: new Date().toISOString(),
      };
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:123/app.bsky.feed.post/123",
        cid: "abc123",
        actorDid: "did:plc:123",
        json: postJson,
      });
      const record = Record.fromJson({
        uri: "at://did:plc:123/app.bsky.feed.post/123",
        cid: "abc123",
        json: postJson,
      });

      // Act
      await indexPostService.upsert({ ctx, record });

      // Assert
      const [post] = await ctx.db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.uri, record.uri.toString()))
        .limit(1);
      expect(post).toBeDefined();
    });
  });

  describe("shouldSave", () => {
    it("subscriberの投稿は保存すべき", async () => {
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
          appviewDid: "did:web:api.dawn.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:subscriber/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:subscriber",
        appviewDid: "did:web:api.dawn.test",
        createdAt: new Date(),
      });

      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:subscriber/app.bsky.feed.post/123",
        cid: "abc123",
        json: postJson,
      });

      // Act
      const result = await indexPostService.shouldSave({ ctx, record });

      // Assert
      expect(result).toBe(true);
    });

    it("subscriberにフォローされているユーザーの投稿は保存すべき", async () => {
      // Arrange
      // subscriber
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:subscriber2",
        handle: "subscriber2.bsky.social",
      });
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:subscriber2/dev.mkizka.test.subscription/456",
        cid: "bafyreib2rxk3rybk3aobmv5cjuql3bm2twh4jvxuiqn2kwedfr7o4vck6e",
        actorDid: "did:plc:subscriber2",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:api.dawn.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:subscriber2/dev.mkizka.test.subscription/456",
        cid: "bafyreib2rxk3rybk3aobmv5cjuql3bm2twh4jvxuiqn2kwedfr7o4vck6e",
        actorDid: "did:plc:subscriber2",
        appviewDid: "did:web:api.dawn.test",
        createdAt: new Date(),
      });

      // フォローされているユーザー
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:followed",
        handle: "followed.bsky.social",
      });

      // followレコード
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:subscriber2/app.bsky.graph.follow/789",
        cid: "bafyreibjifzpqj6o6wcq3hejh7y4tgjxw3yskvmxj5bqypczjhkpaxmqr4",
        actorDid: "did:plc:subscriber2",
        json: {
          $type: "app.bsky.graph.follow",
          subject: "did:plc:followed",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.follows).values({
        uri: "at://did:plc:subscriber2/app.bsky.graph.follow/789",
        cid: "bafyreibjifzpqj6o6wcq3hejh7y4tgjxw3yskvmxj5bqypczjhkpaxmqr4",
        actorDid: "did:plc:subscriber2",
        subjectDid: "did:plc:followed",
        createdAt: new Date(),
      });

      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post from followed user",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:followed/app.bsky.feed.post/123",
        cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        json: postJson,
      });

      // Act
      const result = await indexPostService.shouldSave({ ctx, record });

      // Assert
      expect(result).toBe(true);
    });

    it("DBに存在する投稿への返信は保存すべき", async () => {
      // Arrange
      // 元の投稿のactor
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:originalPoster",
        handle: "original.bsky.social",
      });
      const originalPostUri =
        "at://did:plc:originalPoster/app.bsky.feed.post/original";
      await ctx.db.insert(schema.records).values({
        uri: originalPostUri,
        cid: "bafyreihml5hpzt7wajfixoystmq6vttmtigdsupjrvajqkauyiuozp3r7m",
        actorDid: "did:plc:originalPoster",
        json: {
          $type: "app.bsky.feed.post",
          text: "original post",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.posts).values({
        uri: originalPostUri,
        cid: "bafyreihml5hpzt7wajfixoystmq6vttmtigdsupjrvajqkauyiuozp3r7m",
        actorDid: "did:plc:originalPoster",
        text: "original post",
        createdAt: new Date(),
      });

      // 返信するactor（subscriberではない）
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:replier",
        handle: "replier.bsky.social",
      });

      const replyJson = {
        $type: "app.bsky.feed.post",
        text: "reply to original post",
        reply: {
          parent: {
            uri: originalPostUri,
            cid: "bafyreihml5hpzt7wajfixoystmq6vttmtigdsupjrvajqkauyiuozp3r7m",
          },
          root: {
            uri: originalPostUri,
            cid: "bafyreihml5hpzt7wajfixoystmq6vttmtigdsupjrvajqkauyiuozp3r7m",
          },
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:replier/app.bsky.feed.post/reply123",
        cid: "bafyreihj7fbbzsqgahvoa4f5qhevzxvbcfi6mjlvvinjlfl3uvp5nzl5eu",
        json: replyJson,
      });

      // Act
      const result = await indexPostService.shouldSave({ ctx, record });

      // Assert
      expect(result).toBe(true);
    });

    it("subscriberでもフォロワーでもないユーザーの投稿は保存すべきでない", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:unrelated",
        handle: "unrelated.bsky.social",
      });

      const postJson = {
        $type: "app.bsky.feed.post",
        text: "unrelated post",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:unrelated/app.bsky.feed.post/123",
        cid: "abc123",
        json: postJson,
      });

      // Act
      const result = await indexPostService.shouldSave({ ctx, record });

      // Assert
      expect(result).toBe(false);
    });

    it("DBに存在しない投稿への返信は保存すべきでない", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:replier2",
        handle: "replier2.bsky.social",
      });

      const replyJson = {
        $type: "app.bsky.feed.post",
        text: "reply to non-existent post",
        reply: {
          parent: {
            uri: "at://did:plc:ghost/app.bsky.feed.post/ghost123",
            cid: "bafyreigdcnwvpvpvp2u63ysxt4jkdvjmvzqxjvnwonhsqvlbcvfqhqfvfi",
          },
          root: {
            uri: "at://did:plc:ghost/app.bsky.feed.post/ghost123",
            cid: "bafyreigdcnwvpvpvp2u63ysxt4jkdvjmvzqxjvnwonhsqvlbcvfqhqfvfi",
          },
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:replier2/app.bsky.feed.post/reply456",
        cid: "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe",
        json: replyJson,
      });

      // Act
      const result = await indexPostService.shouldSave({ ctx, record });

      // Assert
      expect(result).toBe(false);
    });
  });
});
