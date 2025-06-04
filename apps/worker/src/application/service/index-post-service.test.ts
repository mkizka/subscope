import type { TransactionContext } from "@dawn/common/domain";
import { Record } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { setupTestDatabase } from "@dawn/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { PostRepository } from "../../infrastructure/post-repository.js";
import { SubscriptionRepository } from "../../infrastructure/subscription-repository.js";
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
    it("投稿者がsubscriberの場合、trueを返す", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:shouldsave-author1",
        handle: "shouldsave-author1.bsky.social",
      });
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:shouldsave-author1/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:shouldsave-author1",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:api.dawn.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:shouldsave-author1/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:shouldsave-author1",
        appviewDid: "did:web:api.dawn.test",
        createdAt: new Date(),
      });
      const record = Record.fromJson({
        uri: "at://did:plc:shouldsave-author1/app.bsky.feed.post/123",
        cid: "post123",
        json: {
          $type: "app.bsky.feed.post",
          text: "hello",
          createdAt: new Date().toISOString(),
        },
      });

      // Act
      const result = await indexPostService.shouldSave({ ctx, record });

      // Assert
      expect(result).toBe(true);
    });

    it("リプライ先の投稿が存在する場合、trueを返す", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values([
        {
          did: "did:plc:reply-author",
          handle: "reply-author.bsky.social",
        },
        {
          did: "did:plc:reply-parent",
          handle: "reply-parent.bsky.social",
        },
      ]);
      const parentPostJson = {
        $type: "app.bsky.feed.post",
        text: "parent",
        createdAt: new Date().toISOString(),
      };
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:reply-parent/app.bsky.feed.post/1",
        cid: "parentcid",
        actorDid: "did:plc:reply-parent",
        json: parentPostJson,
      });
      await ctx.db.insert(schema.posts).values({
        uri: "at://did:plc:reply-parent/app.bsky.feed.post/1",
        cid: "parentcid",
        actorDid: "did:plc:reply-parent",
        text: "parent",
        createdAt: new Date(),
      });
      const record = Record.fromJson({
        uri: "at://did:plc:reply-author/app.bsky.feed.post/1",
        cid: "replycid",
        json: {
          $type: "app.bsky.feed.post",
          text: "reply",
          reply: {
            parent: {
              uri: "at://did:plc:reply-parent/app.bsky.feed.post/1",
              cid: "parentcid",
            },
            root: {
              uri: "at://did:plc:reply-parent/app.bsky.feed.post/1",
              cid: "parentcid",
            },
          },
          createdAt: new Date().toISOString(),
        },
      });

      // Act
      const result = await indexPostService.shouldSave({ ctx, record });

      // Assert
      expect(result).toBe(true);
    });

    it("条件を満たさない場合、falseを返す", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:nosave-author",
        handle: "nosave-author.bsky.social",
      });
      const record = Record.fromJson({
        uri: "at://did:plc:nosave-author/app.bsky.feed.post/1",
        cid: "nosavecid",
        json: {
          $type: "app.bsky.feed.post",
          text: "nosave",
          createdAt: new Date().toISOString(),
        },
      });

      // Act
      const result = await indexPostService.shouldSave({ ctx, record });

      // Assert
      expect(result).toBe(false);
    });
  });
});
