import type { TransactionContext } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  actorFactory,
  likeFactory,
  postFactory,
  recordFactory,
  setupTestDatabase,
  subscriptionFactory,
} from "@repo/test-utils";
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
      const subscriberActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:subscriber",
          handle: () => "subscriber.bsky.social",
        })
        .create();
      // subscriptionレコード用のrecordsテーブルエントリ
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => subscriberActor })
        .props({
          uri: () => "at://did:plc:subscriber/dev.mkizka.test.subscription/123",
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
      await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => subscriberActor })
        .props({
          uri: () => "at://did:plc:subscriber/app.bsky.feed.like/123",
          cid: () => "abc123",
          json: () => likeJson,
        })
        .create();
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
      const authorActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:author",
          handle: () => "author.bsky.social",
        })
        .create();
      const user3Actor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:user3",
          handle: () => "user3.bsky.social",
        })
        .create();
      const user4Actor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:user4",
          handle: () => "user4.bsky.social",
        })
        .create();

      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => authorActor })
        .props({
          uri: () => postUri,
          cid: () => "post123",
        })
        .create();
      const like1Record = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => user3Actor })
        .props({
          uri: () => "at://did:plc:user3/app.bsky.feed.like/1",
          cid: () => "like1",
        })
        .create();
      const like2Record = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => user4Actor })
        .props({
          uri: () => "at://did:plc:user4/app.bsky.feed.like/2",
          cid: () => "like2",
        })
        .create();

      await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .props({
          text: () => "Test post",
        })
        .create();

      // 既存のいいねを2つ追加
      await likeFactory(ctx.db)
        .vars({ record: () => like1Record })
        .props({
          subjectUri: () => postUri,
          subjectCid: () =>
            "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        })
        .create();
      await likeFactory(ctx.db)
        .vars({ record: () => like2Record })
        .props({
          subjectUri: () => postUri,
          subjectCid: () =>
            "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        })
        .create();

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
        replyCount: 0,
      });
    });

    it("いいねが削除された場合にpost_statsのいいね数が正しく更新される", async () => {
      // Arrange
      const postUri = "at://did:plc:author2/app.bsky.feed.post/456";

      // actorとrecordsテーブルを準備
      const author2Actor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:author2",
          handle: () => "author2.bsky.social",
        })
        .create();
      const user5Actor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:user5",
          handle: () => "user5.bsky.social",
        })
        .create();

      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => author2Actor })
        .props({
          uri: () => postUri,
          cid: () => "post456",
        })
        .create();
      const remainingLikeRecord = await recordFactory(
        ctx.db,
        "app.bsky.feed.like",
      )
        .vars({ actor: () => user5Actor })
        .props({
          uri: () => "at://did:plc:user5/app.bsky.feed.like/remaining",
          cid: () => "remaining",
        })
        .create();

      await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .props({
          text: () => "Test post 2",
        })
        .create();

      // 既存のいいねを1つ追加
      await likeFactory(ctx.db)
        .vars({ record: () => remainingLikeRecord })
        .props({
          subjectUri: () => postUri,
          subjectCid: () =>
            "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        })
        .create();

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
        replyCount: 0,
      });
    });

    it("対象の投稿が存在しない場合はpost_statsを更新しない", async () => {
      // Arrange
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
      const record = Record.fromJson({
        uri: "at://did:plc:liker/app.bsky.feed.like/orphan",
        cid: "orphanlike",
        json: likeJson,
      });

      // Act
      await likeIndexer.updateStats({ ctx, record });

      // Assert
      const stats = await ctx.db
        .select()
        .from(schema.postStats)
        .where(eq(schema.postStats.postUri, nonExistentPostUri));

      expect(stats).toHaveLength(0);
    });
  });
});
