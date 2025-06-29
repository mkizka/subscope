import { Like, Record } from "@repo/common/domain";
import {
  actorFactory,
  getTestSetup,
  postFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { describe, expect, it } from "vitest";

import { PostRepository } from "../infrastructure/post-repository.js";
import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { LikeIndexingPolicy } from "./like-indexing-policy.js";

const { testInjector, ctx } = getTestSetup();

const likeIndexingPolicy = testInjector
  .provideClass("postRepository", PostRepository)
  .provideClass("subscriptionRepository", SubscriptionRepository)
  .injectClass(LikeIndexingPolicy);

describe("LikeIndexingPolicy", () => {
  describe("shouldIndex", () => {
    it("subscriberのいいねは保存すべき", async () => {
      // arrange
      const subscriberActor = await actorFactory(ctx.db).create();

      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => subscriberActor })
        .create();
      await subscriptionFactory(ctx.db)
        .vars({ record: () => subscriptionRecord })
        .create();

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
        .props({ json: () => likeJson })
        .create();
      const record = Record.fromJson({
        uri: likeRecord.uri,
        cid: likeRecord.cid,
        json: likeJson,
      });

      // act
      const result = await likeIndexingPolicy.shouldIndex(
        ctx,
        Like.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    it("DBに存在する投稿へのいいねは保存すべき", async () => {
      // arrange
      // いいねするactor（subscriberではない）
      const likerActor = await actorFactory(ctx.db).create();

      // いいねされる投稿のactorと投稿
      const posterActor = await actorFactory(ctx.db).create();
      const postRecord = await recordFactory(ctx.db, "app.bsky.feed.post")
        .vars({ actor: () => posterActor })
        .create();
      const post = await postFactory(ctx.db)
        .vars({ record: () => postRecord })
        .create();

      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: post.uri,
          cid: post.cid,
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
      });

      // act
      const result = await likeIndexingPolicy.shouldIndex(
        ctx,
        Like.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    it("subscriberでもなく、DBに存在しない投稿へのいいねは保存すべきでない", async () => {
      // arrange
      const unrelatedActor = await actorFactory(ctx.db).create();

      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: "at://did:plc:ghost/app.bsky.feed.post/ghost123",
          cid: "bafyreigdcnwvpvpvp2u63ysxt4jkdvjmvzqxjvnwonhsqvlbcvfqhqfvfi",
        },
        createdAt: new Date().toISOString(),
      };
      const likeRecord = await recordFactory(ctx.db, "app.bsky.feed.like")
        .vars({ actor: () => unrelatedActor })
        .props({ json: () => likeJson })
        .create();
      const record = Record.fromJson({
        uri: likeRecord.uri,
        cid: likeRecord.cid,
        json: likeJson,
      });

      // act
      const result = await likeIndexingPolicy.shouldIndex(
        ctx,
        Like.from(record),
      );

      // assert
      expect(result).toBe(false);
    });
  });
});
