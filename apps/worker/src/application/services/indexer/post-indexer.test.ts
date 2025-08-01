import type { IJobQueue } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  actorFactory,
  getTestSetup,
  postEmbedRecordFactory,
  postFactory,
  randomCid,
  recordFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";

import { PostIndexingPolicy } from "../../../domain/post-indexing-policy.js";
import { ActorStatsRepository } from "../../../infrastructure/repositories/actor-stats-repository.js";
import { FeedItemRepository } from "../../../infrastructure/repositories/feed-item-repository.js";
import { PostRepository } from "../../../infrastructure/repositories/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/repositories/post-stats-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/repositories/subscription-repository.js";
import { FetchRecordScheduler } from "../scheduler/fetch-record-scheduler.js";
import { PostIndexer } from "./post-indexer.js";

describe("PostIndexer", () => {
  const mockJobQueue = mock<IJobQueue>();
  const { testInjector, ctx } = getTestSetup();

  const postIndexer = testInjector
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideValue("indexLevel", 1)
    .provideClass("postIndexingPolicy", PostIndexingPolicy)
    .provideClass("feedItemRepository", FeedItemRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideValue("jobQueue", mockJobQueue)
    .provideClass("fetchRecordScheduler", FetchRecordScheduler)
    .injectClass(PostIndexer);

  describe("upsert", () => {
    test("subscriberの投稿は実際にDBに保存される", async () => {
      // arrange
      const subscriber = await actorFactory(ctx.db).create();
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "me.subsco.sync.subscription",
      )
        .vars({ actor: () => subscriber })
        .props({
          json: () => ({
            $type: "me.subsco.sync.subscription",
            appviewDid: "did:web:appview.test",
            createdAt: new Date().toISOString(),
          }),
        })
        .create();
      await subscriptionFactory(ctx.db)
        .vars({ record: () => subscriptionRecord })
        .create();

      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post",
        createdAt: new Date().toISOString(),
      };
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => subscriber })
        .props({ json: () => postJson })
        .create();
      const record = Record.fromJson({
        uri: postRecord.uri,
        cid: postRecord.cid,
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });

      // assert
      const [post] = await ctx.db
        .select()
        .from(schema.posts)
        .where(eq(schema.posts.uri, record.uri.toString()))
        .limit(1);
      expect(post).toBeDefined();

      const [feedItem] = await ctx.db
        .select()
        .from(schema.feedItems)
        .where(eq(schema.feedItems.uri, record.uri.toString()))
        .limit(1);
      expect(feedItem).toMatchObject({
        uri: record.uri.toString(),
        type: "post",
        actorDid: subscriber.did,
        subjectUri: null,
      });
    });

    test("embedにレコードが含まれる場合、fetchRecordジョブが追加される", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const embedCid = await randomCid();
      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post with embed",
        embed: {
          $type: "app.bsky.embed.record",
          record: {
            uri: "at://did:plc:embeduser/app.bsky.feed.post/embedpost",
            cid: embedCid,
          },
        },
        createdAt: new Date().toISOString(),
      };
      const recordData = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .props({ json: () => postJson })
        .create();
      const record = Record.fromJson({
        uri: recordData.uri,
        cid: recordData.cid,
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });

      // assert
      expect(mockJobQueue.add).toHaveBeenCalledTimes(1);
      expect(mockJobQueue.add).toHaveBeenCalledWith({
        queueName: "fetchRecord",
        jobName: "at://did:plc:embeduser/app.bsky.feed.post/embedpost",
        data: {
          uri: "at://did:plc:embeduser/app.bsky.feed.post/embedpost",
          depth: 0,
        },
      });
    });

    test("embedがない場合、fetchRecordジョブは追加されない", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post without embed",
        createdAt: new Date().toISOString(),
      };
      const recordData = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => actor })
        .props({ json: () => postJson })
        .create();
      const record = Record.fromJson({
        uri: recordData.uri,
        cid: recordData.cid,
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });

      // assert
      expect(mockJobQueue.add).not.toHaveBeenCalled();
    });
  });

  describe("updateStats", () => {
    test("リプライ投稿時に親投稿のpost_statsのリプライ数が正しく更新される", async () => {
      // arrange
      const parentActor = await actorFactory(ctx.db).create();
      const parentRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => parentActor })
        .create();
      const parentPost = await postFactory(ctx.db)
        .vars({ record: () => parentRecord })
        .props({
          text: () => "Parent post",
        })
        .create();

      const replier1 = await actorFactory(ctx.db).create();
      const reply1Record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => replier1 })
        .create();
      await postFactory(ctx.db)
        .vars({ record: () => reply1Record })
        .props({
          text: () => "Reply 1",
          replyParentUri: () => parentPost.uri,
          replyParentCid: () => parentPost.cid,
        })
        .create();

      const replier2 = await actorFactory(ctx.db).create();
      const reply2Record = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => replier2 })
        .create();
      await postFactory(ctx.db)
        .vars({ record: () => reply2Record })
        .props({
          text: () => "Reply 2",
          replyParentUri: () => parentPost.uri,
          replyParentCid: () => parentPost.cid,
        })
        .create();

      const replier3 = await actorFactory(ctx.db).create();
      const replyJson = {
        $type: "app.bsky.feed.post",
        text: "New reply",
        reply: {
          root: {
            uri: parentPost.uri,
            cid: parentPost.cid,
          },
          parent: {
            uri: parentPost.uri,
            cid: parentPost.cid,
          },
        },
        createdAt: new Date().toISOString(),
      };
      const newReplyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => replier3 })
        .props({ json: () => replyJson })
        .create();
      const record = Record.fromJson({
        uri: newReplyRecord.uri,
        cid: newReplyRecord.cid,
        json: replyJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });
      await postIndexer.updateStats({ ctx, record });

      // assert
      const [stats] = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, parentPost.uri))
        .limit(1);

      expect(stats).toMatchObject({
        postUri: parentPost.uri,
        likeCount: 0,
        repostCount: 0,
        replyCount: 3,
        quoteCount: 0,
      });

      const [actorStats] = await ctx.db
        .select()
        .from(schema.actorStats)
        .where(eq(schema.actorStats.actorDid, replier3.did));

      expect(actorStats).toMatchObject({
        actorDid: replier3.did,
        postsCount: 1,
        followsCount: 0,
        followersCount: 0,
      });
    });

    test("投稿時にactor_statsの投稿数が更新される", async () => {
      // arrange
      const regularActor = await actorFactory(ctx.db).create();
      const postJson = {
        $type: "app.bsky.feed.post",
        text: "Regular post without reply",
        createdAt: new Date().toISOString(),
      };
      const regularRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => regularActor })
        .props({ json: () => postJson })
        .create();
      const record = Record.fromJson({
        uri: regularRecord.uri,
        cid: regularRecord.cid,
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });
      await postIndexer.updateStats({ ctx, record });

      // assert
      const [actorStats] = await ctx.db
        .select()
        .from(schema.actorStats)
        .where(eq(schema.actorStats.actorDid, regularActor.did));

      expect(actorStats).toMatchObject({
        actorDid: regularActor.did,
        postsCount: 1,
        followsCount: 0,
        followersCount: 0,
      });
    });

    test("引用投稿時に引用された投稿のpost_statsのquote数が正しく更新される", async () => {
      // arrange
      const quotedActor = await actorFactory(ctx.db).create();
      const quotedRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => quotedActor })
        .create();
      const quotedPost = await postFactory(ctx.db)
        .vars({ record: () => quotedRecord })
        .props({
          text: () => "Original post to be quoted",
        })
        .create();

      // 既存の引用投稿を作成（データベースに直接挿入）
      const existingQuoteActor = await actorFactory(ctx.db).create();
      const existingQuoteRecord = await recordFactory(
        ctx.db,
        "app.bsky.feed.post",
      )
        .vars({ actor: () => existingQuoteActor })
        .create();
      const existingQuotePost = await postFactory(ctx.db)
        .vars({ record: () => existingQuoteRecord })
        .props({
          text: () => "Existing quote post",
        })
        .create();
      await postEmbedRecordFactory(ctx.db)
        .vars({
          post: () => existingQuotePost,
          embeddedPost: () => quotedPost,
        })
        .create();

      const quotingActor = await actorFactory(ctx.db).create();
      const quoteJson = {
        $type: "app.bsky.feed.post",
        text: "This is a quote post",
        embed: {
          $type: "app.bsky.embed.record",
          record: {
            uri: quotedPost.uri,
            cid: quotedPost.cid,
          },
        },
        createdAt: new Date().toISOString(),
      };
      const newQuoteRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => quotingActor })
        .props({ json: () => quoteJson })
        .create();
      const record = Record.fromJson({
        uri: newQuoteRecord.uri,
        cid: newQuoteRecord.cid,
        json: quoteJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });
      await postIndexer.updateStats({ ctx, record });

      // assert
      const [stats] = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, quotedPost.uri))
        .limit(1);

      expect(stats).toMatchObject({
        postUri: quotedPost.uri,
        likeCount: 0,
        repostCount: 0,
        replyCount: 0,
        quoteCount: 2, // 既存の1つ + 新しい1つ = 2
      });

      const [actorStats] = await ctx.db
        .select()
        .from(schema.actorStats)
        .where(eq(schema.actorStats.actorDid, quotingActor.did));

      expect(actorStats).toMatchObject({
        actorDid: quotingActor.did,
        postsCount: 1,
        followsCount: 0,
        followersCount: 0,
      });
    });

    test("引用された投稿が存在しない場合はpost_statsを更新しない", async () => {
      // arrange
      const quotingActor = await actorFactory(ctx.db).create();
      const nonExistentQuotedUri =
        "at://did:plc:nonexistent/app.bsky.feed.post/quoted";
      const nonExistentQuotedCid =
        "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e";
      const quoteJson = {
        $type: "app.bsky.feed.post",
        text: "Quote of non-existent post",
        embed: {
          $type: "app.bsky.embed.record",
          record: {
            uri: nonExistentQuotedUri,
            cid: nonExistentQuotedCid,
          },
        },
        createdAt: new Date().toISOString(),
      };
      const quoteRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => quotingActor })
        .props({ json: () => quoteJson })
        .create();
      const record = Record.fromJson({
        uri: quoteRecord.uri,
        cid: quoteRecord.cid,
        json: quoteJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });
      await postIndexer.updateStats({ ctx, record });

      // assert
      const stats = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, nonExistentQuotedUri));
      expect(stats).toHaveLength(0);

      const [actorStats] = await ctx.db
        .select()
        .from(schema.actorStats)
        .where(eq(schema.actorStats.actorDid, quotingActor.did));
      expect(actorStats).toMatchObject({
        actorDid: quotingActor.did,
        postsCount: 1,
        followsCount: 0,
        followersCount: 0,
      });
    });

    test("親投稿が存在しない場合はpost_statsを更新しない", async () => {
      // arrange
      const replierActor = await actorFactory(ctx.db).create();
      const nonExistentParentUri =
        "at://did:plc:nonexistent/app.bsky.feed.post/parent";
      const nonExistentParentCid =
        "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e";
      const replyJson = {
        $type: "app.bsky.feed.post",
        text: "Reply to non-existent post",
        reply: {
          root: {
            uri: nonExistentParentUri,
            cid: nonExistentParentCid,
          },
          parent: {
            uri: nonExistentParentUri,
            cid: nonExistentParentCid,
          },
        },
        createdAt: new Date().toISOString(),
      };
      const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => replierActor })
        .props({ json: () => replyJson })
        .create();
      const record = Record.fromJson({
        uri: replyRecord.uri,
        cid: replyRecord.cid,
        json: replyJson,
        indexedAt: new Date(),
      });

      // act
      await postIndexer.upsert({ ctx, record, depth: 0 });
      await postIndexer.updateStats({ ctx, record });

      // assert
      const stats = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, nonExistentParentUri));
      expect(stats).toHaveLength(0);

      const [actorStats] = await ctx.db
        .select()
        .from(schema.actorStats)
        .where(eq(schema.actorStats.actorDid, replierActor.did));
      expect(actorStats).toMatchObject({
        actorDid: replierActor.did,
        postsCount: 1,
        followsCount: 0,
        followersCount: 0,
      });
    });
  });
});
