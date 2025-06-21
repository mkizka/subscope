import type { TransactionContext } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { RepostIndexingPolicy } from "../../../domain/repost-indexing-policy.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import { FeedItemRepository } from "../../../infrastructure/repositories/feed-item-repository.js";
import { RepostRepository } from "../../../infrastructure/repost-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { RepostIndexer } from "./repost-indexer.js";

let repostIndexer: RepostIndexer;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  repostIndexer = testSetup.testInjector
    .provideClass("repostRepository", RepostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("repostIndexingPolicy", RepostIndexingPolicy)
    .provideClass("feedItemRepository", FeedItemRepository)
    .provideClass("postRepository", PostRepository)
    .injectClass(RepostIndexer);
  ctx = testSetup.ctx;
});

describe("RepostIndexer", () => {
  describe("upsert", () => {
    it("リポストレコードを正しく保存する", async () => {
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

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: "at://did:plc:author/app.bsky.feed.post/123",
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:reposter/app.bsky.feed.repost/123",
        cid: "repost123",
        actorDid: "did:plc:reposter",
        json: repostJson,
      });
      const record = Record.fromJson({
        uri: "at://did:plc:reposter/app.bsky.feed.repost/123",
        cid: "repost123",
        json: repostJson,
      });

      // Act
      await repostIndexer.upsert({ ctx, record });

      // Assert
      const reposts = await ctx.db
        .select()
        .from(schema.reposts)
        .where(eq(schema.reposts.uri, record.uri.toString()))
        .limit(1);
      expect(reposts.length).toBe(1);
      expect(reposts[0]?.actorDid).toBe("did:plc:reposter");
      expect(reposts[0]?.subjectUri).toBe(
        "at://did:plc:author/app.bsky.feed.post/123",
      );

      const [feedItem] = await ctx.db
        .select()
        .from(schema.feedItems)
        .where(eq(schema.feedItems.uri, record.uri.toString()))
        .limit(1);
      expect(feedItem).toMatchObject({
        uri: record.uri.toString(),
        type: "repost",
        actorDid: "did:plc:reposter",
        subjectUri: "at://did:plc:author/app.bsky.feed.post/123",
      });
    });
  });

  describe("updateStats", () => {
    it("リポスト追加時にpost_statsのリポスト数が正しく更新される", async () => {
      // Arrange
      const postUri = "at://did:plc:author3/app.bsky.feed.post/123";

      // actorとrecordsテーブルを準備
      await ctx.db.insert(schema.actors).values([
        { did: "did:plc:author3", handle: "author3.bsky.social" },
        { did: "did:plc:user7", handle: "user7.bsky.social" },
        { did: "did:plc:user8", handle: "user8.bsky.social" },
      ]);
      await ctx.db.insert(schema.records).values([
        {
          uri: postUri,
          cid: "post123",
          actorDid: "did:plc:author3",
          json: { $type: "app.bsky.feed.post" },
        },
        {
          uri: "at://did:plc:user7/app.bsky.feed.repost/1",
          cid: "repost1",
          actorDid: "did:plc:user7",
          json: { $type: "app.bsky.feed.repost" },
        },
        {
          uri: "at://did:plc:user8/app.bsky.feed.repost/2",
          cid: "repost2",
          actorDid: "did:plc:user8",
          json: { $type: "app.bsky.feed.repost" },
        },
      ]);
      await ctx.db.insert(schema.posts).values({
        uri: postUri,
        cid: "post123",
        actorDid: "did:plc:author3",
        text: "Test post for repost",
        createdAt: new Date(),
      });

      // 既存のリポストを2つ追加
      await ctx.db.insert(schema.reposts).values([
        {
          uri: "at://did:plc:user7/app.bsky.feed.repost/1",
          cid: "repost1",
          actorDid: "did:plc:user7",
          subjectUri: postUri,
          subjectCid:
            "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
          createdAt: new Date(),
        },
        {
          uri: "at://did:plc:user8/app.bsky.feed.repost/2",
          cid: "repost2",
          actorDid: "did:plc:user8",
          subjectUri: postUri,
          subjectCid:
            "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
          createdAt: new Date(),
        },
      ]);

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: postUri,
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:user9/app.bsky.feed.repost/3",
        cid: "repost3",
        json: repostJson,
      });

      // Act
      await repostIndexer.updateStats({ ctx, record });

      // Assert
      const [stats] = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, postUri))
        .limit(1);

      expect(stats).toMatchObject({
        postUri,
        likeCount: 0,
        repostCount: 2,
        replyCount: 0,
      });
    });

    it("リポストが削除された場合にpost_statsのリポスト数が正しく更新される", async () => {
      // Arrange
      const postUri = "at://did:plc:author4/app.bsky.feed.post/456";

      // actorとrecordsテーブルを準備
      await ctx.db.insert(schema.actors).values([
        { did: "did:plc:author4", handle: "author4.bsky.social" },
        { did: "did:plc:user10", handle: "user10.bsky.social" },
      ]);
      await ctx.db.insert(schema.records).values([
        {
          uri: postUri,
          cid: "post456",
          actorDid: "did:plc:author4",
          json: { $type: "app.bsky.feed.post" },
        },
        {
          uri: "at://did:plc:user10/app.bsky.feed.repost/remaining",
          cid: "remaining",
          actorDid: "did:plc:user10",
          json: { $type: "app.bsky.feed.repost" },
        },
      ]);
      await ctx.db.insert(schema.posts).values({
        uri: postUri,
        cid: "post456",
        actorDid: "did:plc:author4",
        text: "Test post for repost 2",
        createdAt: new Date(),
      });

      // 既存のリポストを1つ追加
      await ctx.db.insert(schema.reposts).values({
        uri: "at://did:plc:user10/app.bsky.feed.repost/remaining",
        cid: "remaining",
        actorDid: "did:plc:user10",
        subjectUri: postUri,
        subjectCid:
          "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        createdAt: new Date(),
      });

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: postUri,
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:user11/app.bsky.feed.repost/deleted",
        cid: "deleted",
        json: repostJson,
      });

      // Act
      await repostIndexer.updateStats({ ctx, record });

      // Assert
      const [stats] = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, postUri))
        .limit(1);

      expect(stats).toMatchObject({
        postUri,
        likeCount: 0,
        repostCount: 1,
        replyCount: 0,
      });
    });

    it("対象の投稿が存在しない場合はpost_statsを更新しない", async () => {
      // Arrange
      const nonExistentPostUri =
        "at://did:plc:nonexistent/app.bsky.feed.post/888";

      const repostJson = {
        $type: "app.bsky.feed.repost",
        subject: {
          uri: nonExistentPostUri,
          cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:reposter/app.bsky.feed.repost/orphan",
        cid: "orphanrepost",
        json: repostJson,
      });

      // Act
      await repostIndexer.updateStats({ ctx, record });

      // Assert
      const stats = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, nonExistentPostUri));

      expect(stats).toHaveLength(0);
    });
  });
});
