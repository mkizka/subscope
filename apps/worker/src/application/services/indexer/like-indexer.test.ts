import type { TransactionContext } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { LikeIndexingPolicy } from "../../../domain/like-indexing-policy.js";
import { LikeRepository } from "../../../infrastructure/like-repository.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
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
    .provideClass("postStatsRepository", PostStatsRepository)
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

  describe("updateStats", () => {
    it("いいね追加時にpost_statsのいいね数が正しく更新される", async () => {
      // Arrange
      const postUri = "at://did:plc:author/app.bsky.feed.post/123";

      // actorとrecordsテーブルを準備
      await ctx.db.insert(schema.actors).values([
        { did: "did:plc:author", handle: "author.bsky.social" },
        { did: "did:plc:user3", handle: "user3.bsky.social" },
        { did: "did:plc:user4", handle: "user4.bsky.social" },
      ]);
      await ctx.db.insert(schema.records).values([
        {
          uri: postUri,
          cid: "post123",
          actorDid: "did:plc:author",
          json: { $type: "app.bsky.feed.post" },
        },
        {
          uri: "at://did:plc:user3/app.bsky.feed.like/1",
          cid: "like1",
          actorDid: "did:plc:user3",
          json: { $type: "app.bsky.feed.like" },
        },
        {
          uri: "at://did:plc:user4/app.bsky.feed.like/2",
          cid: "like2",
          actorDid: "did:plc:user4",
          json: { $type: "app.bsky.feed.like" },
        },
      ]);
      await ctx.db.insert(schema.posts).values({
        uri: postUri,
        cid: "post123",
        actorDid: "did:plc:author",
        text: "Test post",
        createdAt: new Date(),
      });

      // 既存のいいねを2つ追加
      await ctx.db.insert(schema.likes).values([
        {
          uri: "at://did:plc:user3/app.bsky.feed.like/1",
          cid: "like1",
          actorDid: "did:plc:user3",
          subjectUri: postUri,
          subjectCid:
            "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
          createdAt: new Date(),
        },
        {
          uri: "at://did:plc:user4/app.bsky.feed.like/2",
          cid: "like2",
          actorDid: "did:plc:user4",
          subjectUri: postUri,
          subjectCid:
            "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
          createdAt: new Date(),
        },
      ]);

      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: postUri,
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:user5/app.bsky.feed.like/3",
        cid: "like3",
        json: likeJson,
      });

      // Act
      await likeIndexer.updateStats({ ctx, record });

      // Assert
      const [stats] = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, postUri))
        .limit(1);

      expect(stats).toMatchObject({
        postUri,
        likeCount: 2,
        repostCount: 0,
      });
    });

    it("いいねが削除された場合にpost_statsのいいね数が正しく更新される", async () => {
      // Arrange
      const postUri = "at://did:plc:author2/app.bsky.feed.post/456";

      // actorとrecordsテーブルを準備
      await ctx.db.insert(schema.actors).values([
        { did: "did:plc:author2", handle: "author2.bsky.social" },
        { did: "did:plc:user5", handle: "user5.bsky.social" },
      ]);
      await ctx.db.insert(schema.records).values([
        {
          uri: postUri,
          cid: "post456",
          actorDid: "did:plc:author2",
          json: { $type: "app.bsky.feed.post" },
        },
        {
          uri: "at://did:plc:user5/app.bsky.feed.like/remaining",
          cid: "remaining",
          actorDid: "did:plc:user5",
          json: { $type: "app.bsky.feed.like" },
        },
      ]);
      await ctx.db.insert(schema.posts).values({
        uri: postUri,
        cid: "post456",
        actorDid: "did:plc:author2",
        text: "Test post 2",
        createdAt: new Date(),
      });

      // 既存のいいねを1つ追加
      await ctx.db.insert(schema.likes).values({
        uri: "at://did:plc:user5/app.bsky.feed.like/remaining",
        cid: "remaining",
        actorDid: "did:plc:user5",
        subjectUri: postUri,
        subjectCid:
          "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        createdAt: new Date(),
      });

      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: postUri,
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:user6/app.bsky.feed.like/deleted",
        cid: "deleted",
        json: likeJson,
      });

      // Act
      await likeIndexer.updateStats({ ctx, record });

      // Assert
      const [stats] = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, postUri))
        .limit(1);

      expect(stats).toMatchObject({
        postUri,
        likeCount: 1,
        repostCount: 0,
      });
    });
  });
});
