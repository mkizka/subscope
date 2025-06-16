import type { TransactionContext } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { PostIndexingPolicy } from "../../../domain/post-indexing-policy.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { PostIndexer } from "./post-indexer.js";

let postIndexer: PostIndexer;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  postIndexer = testSetup.testInjector
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("postIndexingPolicy", PostIndexingPolicy)
    .injectClass(PostIndexer);
  ctx = testSetup.ctx;
});

describe("PostIndexer", () => {
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
          appviewDid: "did:web:appview.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:123/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:123",
        appviewDid: "did:web:appview.test",
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
      await postIndexer.upsert({ ctx, record });

      // Assert
      const [post] = await ctx.db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.uri, record.uri.toString()))
        .limit(1);
      expect(post).toBeDefined();
    });
  });

  describe("updateStats", () => {
    it("リプライ投稿時に親投稿のpost_statsのリプライ数が正しく更新される", async () => {
      // Arrange
      const parentPostUri = "at://did:plc:parent/app.bsky.feed.post/parent";

      // actorとrecordsテーブルを準備
      await ctx.db.insert(schema.actors).values([
        { did: "did:plc:parent", handle: "parent.bsky.social" },
        { did: "did:plc:replier1", handle: "replier1.bsky.social" },
        { did: "did:plc:replier2", handle: "replier2.bsky.social" },
      ]);
      await ctx.db.insert(schema.records).values([
        {
          uri: parentPostUri,
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
          actorDid: "did:plc:parent",
          json: { $type: "app.bsky.feed.post" },
        },
        {
          uri: "at://did:plc:replier1/app.bsky.feed.post/reply1",
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
          actorDid: "did:plc:replier1",
          json: { $type: "app.bsky.feed.post" },
        },
        {
          uri: "at://did:plc:replier2/app.bsky.feed.post/reply2",
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
          actorDid: "did:plc:replier2",
          json: { $type: "app.bsky.feed.post" },
        },
      ]);
      await ctx.db.insert(schema.posts).values([
        {
          uri: parentPostUri,
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
          actorDid: "did:plc:parent",
          text: "Parent post",
          createdAt: new Date(),
        },
        {
          uri: "at://did:plc:replier1/app.bsky.feed.post/reply1",
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
          actorDid: "did:plc:replier1",
          text: "Reply 1",
          replyParentUri: parentPostUri,
          createdAt: new Date(),
        },
        {
          uri: "at://did:plc:replier2/app.bsky.feed.post/reply2",
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
          actorDid: "did:plc:replier2",
          text: "Reply 2",
          replyParentUri: parentPostUri,
          createdAt: new Date(),
        },
      ]);

      const replyJson = {
        $type: "app.bsky.feed.post",
        text: "New reply",
        reply: {
          root: {
            uri: parentPostUri,
            cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
          },
          parent: {
            uri: parentPostUri,
            cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
          },
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:replier3/app.bsky.feed.post/newreply",
        cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        json: replyJson,
      });

      // Act
      await postIndexer.updateStats({ ctx, record });

      // Assert
      const [stats] = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, parentPostUri))
        .limit(1);

      expect(stats).toMatchObject({
        postUri: parentPostUri,
        likeCount: 0,
        repostCount: 0,
        replyCount: 2,
      });
    });

    it("通常の投稿（リプライでない）の場合は統計更新されない", async () => {
      // Arrange
      const postJson = {
        $type: "app.bsky.feed.post",
        text: "Regular post without reply",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:regular/app.bsky.feed.post/regular",
        cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        json: postJson,
      });

      // Act
      await postIndexer.updateStats({ ctx, record });

      // Assert
      // post_statsテーブルに新しいエントリが作成されていないことを確認
      const stats = await ctx.db
        .select()
        .from(schema.postStats)
        .where(
          eq(
            schema.postStats.postUri,
            "at://did:plc:regular/app.bsky.feed.post/regular",
          ),
        );

      expect(stats).toHaveLength(0);
    });
  });
});
