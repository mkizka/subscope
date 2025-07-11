import type { IJobQueue } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  actorFactory,
  getTestSetup,
  postFactory,
  recordFactory,
  repostFactory,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";

import { RepostIndexingPolicy } from "../../../domain/repost-indexing-policy.js";
import { FeedItemRepository } from "../../../infrastructure/repositories/feed-item-repository.js";
import { PostRepository } from "../../../infrastructure/repositories/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/repositories/post-stats-repository.js";
import { RepostRepository } from "../../../infrastructure/repositories/repost-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/repositories/subscription-repository.js";
import { FetchRecordScheduler } from "../scheduler/fetch-record-scheduler.js";
import { RepostIndexer } from "./repost-indexer.js";

describe("RepostIndexer", () => {
  const mockJobQueue = mock<IJobQueue>();
  const { testInjector, ctx } = getTestSetup();

  const repostIndexer = testInjector
    .provideClass("repostRepository", RepostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("postRepository", PostRepository)
    .provideValue("indexLevel", 1)
    .provideClass("repostIndexingPolicy", RepostIndexingPolicy)
    .provideClass("feedItemRepository", FeedItemRepository)
    .provideValue("jobQueue", mockJobQueue)
    .provideClass("fetchRecordScheduler", FetchRecordScheduler)
    .injectClass(RepostIndexer);

  describe("upsert", () => {
    it("リポストレコードを正しく保存する", async () => {
      // arrange
      const [reposter, author] = await actorFactory(ctx.db).createList(2);
      const subjectUri = `at://${author.did}/app.bsky.feed.post/123`;

      const repostRecord = await recordFactory(ctx.db, "app.bsky.feed.repost")
        .vars({ actor: () => reposter })
        .props({
          json: () => ({
            $type: "app.bsky.feed.repost",
            subject: {
              uri: subjectUri,
              cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
            },
            createdAt: new Date().toISOString(),
          }),
        })
        .create();

      const record = Record.fromJson({
        uri: repostRecord.uri,
        cid: repostRecord.cid,
        json: repostRecord.json,
        indexedAt: new Date(),
      });

      // act
      await repostIndexer.upsert({ ctx, record, depth: 0 });

      // assert
      const [repost] = await ctx.db
        .select()
        .from(schema.reposts)
        .where(eq(schema.reposts.uri, record.uri.toString()))
        .limit(1);
      expect(repost).toMatchObject({
        actorDid: reposter.did,
        subjectUri,
      });

      const [feedItem] = await ctx.db
        .select()
        .from(schema.feedItems)
        .where(eq(schema.feedItems.uri, record.uri.toString()))
        .limit(1);
      expect(feedItem).toMatchObject({
        uri: record.uri.toString(),
        type: "repost",
        actorDid: reposter.did,
        subjectUri,
      });

      expect(mockJobQueue.add).toHaveBeenCalledWith({
        queueName: "fetchRecord",
        jobName: subjectUri,
        data: {
          uri: subjectUri,
          depth: 0,
        },
      });
    });
  });

  describe("updateStats", () => {
    it("リポスト追加時にpost_statsのリポスト数が正しく更新される", async () => {
      // arrange
      const post = await postFactory(ctx.db).create();

      await repostFactory(ctx.db)
        .vars({ subject: () => post })
        .createList(2);

      const newRepostRecord = await recordFactory(
        ctx.db,
        "app.bsky.feed.repost",
      )
        .props({
          json: () => ({
            $type: "app.bsky.feed.repost",
            subject: {
              uri: post.uri,
              cid: post.cid,
            },
            createdAt: new Date().toISOString(),
          }),
        })
        .create();

      const record = Record.fromJson({
        uri: newRepostRecord.uri,
        cid: newRepostRecord.cid,
        json: newRepostRecord.json,
        indexedAt: new Date(),
      });

      // act
      await repostIndexer.updateStats({ ctx, record });

      // assert
      const [stats] = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, post.uri))
        .limit(1);

      // 既存の2つのリポストがカウントされるため、repostCount=2
      expect(stats).toMatchObject({
        postUri: post.uri,
        likeCount: 0,
        repostCount: 2,
        replyCount: 0,
      });
    });

    it("対象の投稿が存在しない場合はpost_statsを更新しない", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const nonExistentPostUri = `at://${actor.did}/app.bsky.feed.post/nonexistent`;

      const orphanRepostRecord = await recordFactory(
        ctx.db,
        "app.bsky.feed.repost",
      )
        .props({
          json: () => ({
            $type: "app.bsky.feed.repost",
            subject: {
              uri: nonExistentPostUri,
              cid: "bafkreihwsnuregfeqh263vgdathcprnbvatyat6h6mu7ipjhhodcdbyhoy",
            },
            createdAt: new Date().toISOString(),
          }),
        })
        .create();

      const record = Record.fromJson({
        uri: orphanRepostRecord.uri,
        cid: orphanRepostRecord.cid,
        json: orphanRepostRecord.json,
        indexedAt: new Date(),
      });

      // act
      await repostIndexer.updateStats({ ctx, record });

      // assert
      const stats = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, nonExistentPostUri));

      // 対象の投稿がpostsテーブルに存在しないため、post_statsレコードは作成されない（0件）
      expect(stats).toHaveLength(0);
    });
  });
});
