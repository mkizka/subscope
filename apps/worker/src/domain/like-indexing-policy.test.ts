import { Like, Record } from "@repo/common/domain";
import {
  actorFactory,
  getTestSetup,
  postFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorRepository } from "../infrastructure/repositories/actor-repository.js";
import { SubscriptionRepository } from "../infrastructure/repositories/subscription-repository.js";
import { LikeIndexingPolicy } from "./like-indexing-policy.js";

describe("LikeIndexingPolicy", () => {
  const { testInjector, ctx } = getTestSetup();

  describe("INDEX_LEVEL=1", () => {
    const likeIndexingPolicy = testInjector
      .provideClass("subscriptionRepository", SubscriptionRepository)
      .provideClass("actorRepository", ActorRepository)
      .provideValue("indexLevel", 1)
      .injectClass(LikeIndexingPolicy);

    describe("shouldIndex", () => {
      test("subscriberのいいねは保存すべき", async () => {
        // arrange
        const subscriberActor = await actorFactory(ctx.db).create();

        await subscriptionFactory(ctx.db)
          .vars({ actor: () => subscriberActor })
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
          indexedAt: new Date(),
        });

        // act
        const result = await likeIndexingPolicy.shouldIndex(
          ctx,
          Like.from(record),
        );

        // assert
        expect(result).toBe(true);
      });

      test("subscribersの投稿へのいいねは保存すべき", async () => {
        // arrange
        const likerActor = await actorFactory(ctx.db).create();

        const subscriberActor = await actorFactory(ctx.db).create();
        await subscriptionFactory(ctx.db)
          .vars({ actor: () => subscriberActor })
          .create();

        const subscriberPostRecord = await recordFactory(
          ctx.db,
          "app.bsky.feed.post",
        )
          .vars({ actor: () => subscriberActor })
          .create();
        const subscriberPost = await postFactory(ctx.db)
          .vars({ record: () => subscriberPostRecord })
          .create();

        const likeJson = {
          $type: "app.bsky.feed.like",
          subject: {
            uri: subscriberPost.uri,
            cid: subscriberPost.cid,
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
        const result = await likeIndexingPolicy.shouldIndex(
          ctx,
          Like.from(record),
        );

        // assert
        expect(result).toBe(true);
      });

      test("subscriberでもなく、DBに存在しない投稿へのいいねは保存すべきでない", async () => {
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
          indexedAt: new Date(),
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

  describe("INDEX_LEVEL=2", () => {
    const likeIndexingPolicyLevel2 = testInjector
      .provideClass("subscriptionRepository", SubscriptionRepository)
      .provideClass("actorRepository", ActorRepository)
      .provideValue("indexLevel", 2)
      .injectClass(LikeIndexingPolicy);

    describe("shouldIndex", () => {
      test("INDEX_LEVEL=1の条件も満たす場合は保存すべき", async () => {
        // arrange
        const subscriberActor = await actorFactory(ctx.db).create();
        await subscriptionFactory(ctx.db)
          .vars({ actor: () => subscriberActor })
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
          indexedAt: new Date(),
        });

        // act
        const result = await likeIndexingPolicyLevel2.shouldIndex(
          ctx,
          Like.from(record),
        );

        // assert
        expect(result).toBe(true);
      });

      test("subscribersのフォロイーの投稿へのいいねは保存すべき", async () => {
        // arrange
        const likerActor = await actorFactory(ctx.db).create();

        const followeeActor = await actorFactory(ctx.db)
          .props({ isFollowedBySubscriber: () => true })
          .create();

        const followeePostRecord = await recordFactory(
          ctx.db,
          "app.bsky.feed.post",
        )
          .vars({ actor: () => followeeActor })
          .create();
        const followeePost = await postFactory(ctx.db)
          .vars({ record: () => followeePostRecord })
          .create();

        const likeJson = {
          $type: "app.bsky.feed.like",
          subject: {
            uri: followeePost.uri,
            cid: followeePost.cid,
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
        const result = await likeIndexingPolicyLevel2.shouldIndex(
          ctx,
          Like.from(record),
        );

        // assert
        expect(result).toBe(true);
      });

      test("subscribersがフォローしていないユーザーの投稿へのいいねは保存すべきでない", async () => {
        // arrange
        const likerActor = await actorFactory(ctx.db).create();

        const subscriberActor = await actorFactory(ctx.db).create();
        await subscriptionFactory(ctx.db)
          .vars({ actor: () => subscriberActor })
          .create();

        const nonFolloweeActor = await actorFactory(ctx.db).create();
        const nonFolloweePostRecord = await recordFactory(
          ctx.db,
          "app.bsky.feed.post",
        )
          .vars({ actor: () => nonFolloweeActor })
          .create();
        const nonFolloweePost = await postFactory(ctx.db)
          .vars({ record: () => nonFolloweePostRecord })
          .create();

        const likeJson = {
          $type: "app.bsky.feed.like",
          subject: {
            uri: nonFolloweePost.uri,
            cid: nonFolloweePost.cid,
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
        const result = await likeIndexingPolicyLevel2.shouldIndex(
          ctx,
          Like.from(record),
        );

        // assert
        expect(result).toBe(false);
      });
    });
  });
});
