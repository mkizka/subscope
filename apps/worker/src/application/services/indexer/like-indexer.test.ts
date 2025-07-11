import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  actorFactory,
  getTestSetup,
  likeFactory,
  postFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { LikeIndexingPolicy } from "../../../domain/like-indexing-policy.js";
import { LikeRepository } from "../../../infrastructure/repositories/like-repository.js";
import { PostRepository } from "../../../infrastructure/repositories/post-repository.js";
import { PostStatsRepository } from "../../../infrastructure/repositories/post-stats-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/repositories/subscription-repository.js";
import { LikeIndexer } from "./like-indexer.js";

describe("LikeIndexer", () => {
  const { testInjector, ctx } = getTestSetup();

  const likeIndexer = testInjector
    .provideClass("likeRepository", LikeRepository)
    .provideClass("postRepository", PostRepository)
    .provideClass("postStatsRepository", PostStatsRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideValue("indexLevel", 1)
    .provideClass("likeIndexingPolicy", LikeIndexingPolicy)
    .injectClass(LikeIndexer);

  describe("upsert", () => {
    it("subscriberのいいねは実際にDBに保存される", async () => {
      // arrange
      // subscriberとしてactor情報を準備
      const subscriberActor = await actorFactory(ctx.db).create();
      // subscriptionレコード用のrecordsテーブルエントリ
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => subscriberActor })
        .props({
          uri: () =>
            `at://${subscriberActor.did}/dev.mkizka.test.subscription/123`,
          cid: () => "sub123",
        })
        .create();
      await subscriptionFactory(ctx.db)
        .vars({ record: () => subscriptionRecord })
        .props({
          appviewDid: () => "did:web:appview.test",
        })
        .create();

      // いいねレコード用のrecordsテーブルエントリ
      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: "at://did:plc:other/app.bsky.feed.post/123",
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        },
        createdAt: new Date().toISOString(),
      };
      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => subscriberActor })
        .props({
          uri: () => `at://${subscriberActor.did}/app.bsky.feed.like/123`,
          cid: () => "abc123",
          json: () => likeJson,
        })
        .create();
      const record = Record.fromJson({
        uri: likeRecord.uri,
        cid: likeRecord.cid,
        json: likeJson,
        indexedAt: new Date(),
      });

      // act
      await likeIndexer.upsert({ ctx, record });

      // assert
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
      // arrange
      // actorとrecordsテーブルを準備
      const [authorActor, ...likeActors] = await actorFactory(
        ctx.db,
      ).createList(3);

      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => authorActor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .props({
          text: () => "Test post",
        })
        .create();

      // 既存のいいねを2つ追加
      for (const actor of likeActors.slice(0, 2)) {
        const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
          .vars({ actor: () => actor })
          .create();
        await likeFactory(ctx.db)
          .vars({ record: () => likeRecord })
          .props({
            subjectUri: () => post.uri,
            subjectCid: () => post.cid,
          })
          .create();
      }

      const user5Actor = await actorFactory(ctx.db).create();
      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: post.uri,
          cid: post.cid,
        },
        createdAt: new Date().toISOString(),
      };
      const user5LikeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => user5Actor })
        .props({ json: () => likeJson })
        .create();
      const record = Record.fromJson({
        uri: user5LikeRecord.uri,
        cid: user5LikeRecord.cid,
        json: likeJson,
        indexedAt: new Date(),
      });

      // act
      await likeIndexer.updateStats({ ctx, record });

      // assert
      const [stats] = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, post.uri))
        .limit(1);

      expect(stats).toMatchObject({
        postUri: post.uri,
        likeCount: 2,
        repostCount: 0,
        replyCount: 0,
      });
    });

    it("いいねが削除された場合にpost_statsのいいね数が正しく更新される", async () => {
      // arrange
      // actorとrecordsテーブルを準備
      const [authorActor, user5Actor, user6Actor] = await actorFactory(
        ctx.db,
      ).createList(3);

      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => authorActor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .props({
          text: () => "Test post 2",
        })
        .create();

      // 既存のいいねを1つ追加
      const user5LikeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => user5Actor })
        .create();
      await likeFactory(ctx.db)
        .vars({ record: () => user5LikeRecord })
        .props({
          subjectUri: () => post.uri,
          subjectCid: () => post.cid,
        })
        .create();

      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: post.uri,
          cid: post.cid,
        },
        createdAt: new Date().toISOString(),
      };
      const user6LikeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => user6Actor })
        .props({ json: () => likeJson })
        .create();
      const record = Record.fromJson({
        uri: user6LikeRecord.uri,
        cid: user6LikeRecord.cid,
        json: likeJson,
        indexedAt: new Date(),
      });

      // act
      await likeIndexer.updateStats({ ctx, record });

      // assert
      const [stats] = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, post.uri))
        .limit(1);

      expect(stats).toMatchObject({
        postUri: post.uri,
        likeCount: 1,
        repostCount: 0,
        replyCount: 0,
      });
    });

    it("対象の投稿が存在しない場合はpost_statsを更新しない", async () => {
      // arrange
      const likerActor = await actorFactory(ctx.db).create();
      const nonExistentPostUri =
        "at://did:plc:nonexistent/app.bsky.feed.post/999";

      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: nonExistentPostUri,
          cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        },
        createdAt: new Date().toISOString(),
      };
      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => likerActor })
        .props({ json: () => likeJson })
        .create();
      const record = Record.fromJson({
        uri: likeRecord.uri,
        cid: likeRecord.cid,
        json: likeJson,
        indexedAt: new Date(),
      });

      // act
      await likeIndexer.updateStats({ ctx, record });

      // assert
      const stats = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, nonExistentPostUri));

      expect(stats).toHaveLength(0);
    });
  });
});
