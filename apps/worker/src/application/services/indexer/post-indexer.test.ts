import type { IJobQueue, TransactionContext } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  actorFactory,
  postFactory,
  recordFactory,
  setupTestDatabase,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";

import { PostIndexingPolicy } from "../../../domain/post-indexing-policy.js";
import { ActorStatsRepository } from "../../../infrastructure/actor-stats-repository.js";
import { PostRepository } from "../../../infrastructure/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/post-stats-repository.js";
import { FeedItemRepository } from "../../../infrastructure/repositories/feed-item-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { FetchRecordService } from "../scheduler/fetch-record-service.js";
import { PostIndexer } from "./post-indexer.js";

let postIndexer: PostIndexer;
let ctx: TransactionContext;
let mockJobQueue: IJobQueue;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  mockJobQueue = mock<IJobQueue>();
  postIndexer = testSetup.testInjector
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("postIndexingPolicy", PostIndexingPolicy)
    .provideClass("feedItemRepository", FeedItemRepository)
    .provideClass("actorStatsRepository", ActorStatsRepository)
    .provideValue("jobQueue", mockJobQueue)
    .provideClass("fetchRecordService", FetchRecordService)
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

      const [feedItem] = await ctx.db
        .select()
        .from(schema.feedItems)
        .where(eq(schema.feedItems.uri, record.uri.toString()))
        .limit(1);
      expect(feedItem).toMatchObject({
        uri: record.uri.toString(),
        type: "post",
        actorDid: "did:plc:123",
        subjectUri: null,
      });
    });

    it("embedにレコードが含まれる場合、fetchRecordジョブが追加される", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post with embed",
        embed: {
          $type: "app.bsky.embed.record",
          record: {
            uri: "at://did:plc:embeduser/app.bsky.feed.post/embedpost",
            cid: "embedcid123",
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
      });

      // act
      await postIndexer.upsert({ ctx, record });

      // assert
      expect(mockJobQueue.add).toHaveBeenCalledTimes(1);
      expect(mockJobQueue.add).toHaveBeenCalledWith({
        queueName: "fetchRecord",
        jobName: "at://did:plc:embeduser/app.bsky.feed.post/embedpost",
        data: "at://did:plc:embeduser/app.bsky.feed.post/embedpost",
      });
    });

    it("embedがない場合、fetchRecordジョブは追加されない", async () => {
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
      });

      // act
      await postIndexer.upsert({ ctx, record });

      // assert
      expect(mockJobQueue.add).not.toHaveBeenCalled();
    });
  });

  describe("updateStats", () => {
    it("リプライ投稿時に親投稿のpost_statsのリプライ数が正しく更新される", async () => {
      // arrange
      // 親投稿を作成
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

      // 既存のリプライを2つ作成
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

      // 新しいリプライを作成するアクター
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

      // 新しいリプライのrecordを作成
      const newReplyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => replier3 })
        .props({ json: () => replyJson })
        .create();
      const record = Record.fromJson({
        uri: newReplyRecord.uri,
        cid: newReplyRecord.cid,
        json: replyJson,
      });

      // act
      await postIndexer.upsert({ ctx, record });
      await postIndexer.updateStats({ ctx, record });

      // assert
      // 親投稿のpost_statsが更新される
      const [stats] = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, parentPost.uri))
        .limit(1);

      expect(stats).toMatchObject({
        postUri: parentPost.uri,
        likeCount: 0,
        repostCount: 0,
        replyCount: 3, // 既存の2リプライ + 新しい1リプライ
      });

      // 投稿者のactor_statsも更新される
      const [actorStats] = await ctx.db
        .select()
        .from(schema.actorStats)
        .where(eq(schema.actorStats.actorDid, replier3.did));

      expect(actorStats).toMatchObject({
        actorDid: replier3.did,
        postsCount: 1, // replier3の投稿は1件のみ
        followsCount: 0,
        followersCount: 0,
      });
    });

    it("投稿時にactor_statsの投稿数が更新される", async () => {
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
      });

      // act
      await postIndexer.upsert({ ctx, record });
      await postIndexer.updateStats({ ctx, record });

      // assert
      // actor_statsテーブルに投稿数が更新されていることを確認
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

    it("親投稿が存在しない場合はpost_statsを更新しない", async () => {
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

      // recordを作成
      const replyRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => replierActor })
        .props({ json: () => replyJson })
        .create();
      const record = Record.fromJson({
        uri: replyRecord.uri,
        cid: replyRecord.cid,
        json: replyJson,
      });

      // act
      await postIndexer.upsert({ ctx, record });
      await postIndexer.updateStats({ ctx, record });

      // assert
      // 親投稿のpost_statsは更新されない
      const stats = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, nonExistentParentUri));

      expect(stats).toHaveLength(0);

      // ただし、投稿者のactor_statsは更新される
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
