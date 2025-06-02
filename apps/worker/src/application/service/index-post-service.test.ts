import { Record } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { setupTestDatabase } from "@dawn/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { PostRepository } from "../../infrastructure/post-repository.js";
import { SubscriptionRepository } from "../../infrastructure/subscription-repository.js";
import { IndexPostService } from "./index-post-service.js";

const { getSetup } = setupTestDatabase();

describe("IndexPostService", () => {
  describe("upsert", () => {
    it("subscriberの投稿は実際にDBに保存される", async () => {
      const { testInjector, ctx } = getSetup();
      const injector = testInjector
        .provideClass("postRepository", PostRepository)
        .provideClass("subscriptionRepository", SubscriptionRepository)
        .provideClass("indexPostService", IndexPostService);

      const indexPostService = injector.resolve("indexPostService");

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
      await indexPostService.upsert({ ctx, record });
      const [post] = await ctx.db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.uri, record.uri.toString()))
        .limit(1);
      expect(post).toBeDefined();
    });
  });
});
