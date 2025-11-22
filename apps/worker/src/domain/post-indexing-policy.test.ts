import { Post, Record } from "@repo/common/domain";
import {
  actorFactory,
  followFactory,
  postFactory,
  recordFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { SubscriptionRepository } from "../infrastructure/repositories/subscription-repository.js";
import { PostIndexingPolicy } from "./post-indexing-policy.js";

describe("PostIndexingPolicy", () => {
  const { testInjector, ctx } = testSetup;

  const postIndexingPolicy = testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(PostIndexingPolicy);

  describe("shouldIndex", () => {
    test("subscriberの投稿は保存すべき", async () => {
      // arrange
      const subscriberActor = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriberActor })
        .create();

      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: `at://${subscriberActor.did}/app.bsky.feed.post/123`,
        cid: "abc123",
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(
        ctx,
        Post.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("subscriberにフォローされているユーザーの投稿は保存すべき", async () => {
      // arrange
      const subscriberActor = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriberActor })
        .create();

      const followedActor = await actorFactory(ctx.db).create();

      await followFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.follow")
              .vars({ actor: () => subscriberActor })
              .create(),
          followee: () => followedActor,
        })
        .create();

      const postJson = {
        $type: "app.bsky.feed.post",
        text: "test post from followed user",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: `at://${followedActor.did}/app.bsky.feed.post/123`,
        cid: "bafyreig7ox2b5kmcqjjspzhlenbhhcnqv3fq2uqisd5ixosft2qkyj524e",
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(
        ctx,
        Post.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("subscribersへのリプライは保存すべき", async () => {
      // arrange
      const subscriberActor = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriberActor })
        .create();

      const subscriberPost = await postFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.post")
              .vars({ actor: () => subscriberActor })
              .create(),
        })
        .props({
          text: () => "subscriber post",
        })
        .create();

      const replierActor = await actorFactory(ctx.db).create();

      const replyJson = {
        $type: "app.bsky.feed.post",
        text: "reply to subscriber",
        reply: {
          parent: {
            uri: subscriberPost.uri,
            cid: subscriberPost.cid,
          },
          root: {
            uri: subscriberPost.uri,
            cid: subscriberPost.cid,
          },
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: `at://${replierActor.did}/app.bsky.feed.post/reply123`,
        cid: "bafyreihj7fbbzsqgahvoa4f5qhevzxvbcfi6mjlvvinjlfl3uvp5nzl5eu",
        json: replyJson,
        indexedAt: new Date(),
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(
        ctx,
        Post.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("subscriberでもフォロワーでもないユーザーの投稿は保存すべきでない", async () => {
      // arrange
      const unrelatedActor = await actorFactory(ctx.db).create();

      const postJson = {
        $type: "app.bsky.feed.post",
        text: "unrelated post",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: `at://${unrelatedActor.did}/app.bsky.feed.post/123`,
        cid: "abc123",
        json: postJson,
        indexedAt: new Date(),
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(
        ctx,
        Post.from(record),
      );

      // assert
      expect(result).toBe(false);
    });

    test("DBに存在しない投稿への返信は保存すべきでない", async () => {
      // arrange
      const replierActor = await actorFactory(ctx.db).create();

      const replyJson = {
        $type: "app.bsky.feed.post",
        text: "reply to non-existent post",
        reply: {
          parent: {
            uri: "at://did:plc:ghost/app.bsky.feed.post/ghost123",
            cid: "bafyreigdcnwvpvpvp2u63ysxt4jkdvjmvzqxjvnwonhsqvlbcvfqhqfvfi",
          },
          root: {
            uri: "at://did:plc:ghost/app.bsky.feed.post/ghost123",
            cid: "bafyreigdcnwvpvpvp2u63ysxt4jkdvjmvzqxjvnwonhsqvlbcvfqhqfvfi",
          },
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: `at://${replierActor.did}/app.bsky.feed.post/reply456`,
        cid: "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe",
        json: replyJson,
        indexedAt: new Date(),
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(
        ctx,
        Post.from(record),
      );

      // assert
      expect(result).toBe(false);
    });

    test("subscribersのフォロイーへのリプライは保存すべき", async () => {
      // arrange
      const subscriberActor = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriberActor })
        .create();

      const followeeActor = await actorFactory(ctx.db).create();
      await followFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.graph.follow")
              .vars({ actor: () => subscriberActor })
              .create(),
          followee: () => followeeActor,
        })
        .create();

      const followeePost = await postFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.post")
              .vars({ actor: () => followeeActor })
              .create(),
        })
        .props({
          text: () => "followee post",
        })
        .create();

      const replierActor = await actorFactory(ctx.db).create();

      const replyJson = {
        $type: "app.bsky.feed.post",
        text: "reply to followee post",
        reply: {
          parent: {
            uri: followeePost.uri,
            cid: followeePost.cid,
          },
          root: {
            uri: followeePost.uri,
            cid: followeePost.cid,
          },
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: `at://${replierActor.did}/app.bsky.feed.post/reply123`,
        cid: "bafyreihj7fbbzsqgahvoa4f5qhevzxvbcfi6mjlvvinjlfl3uvp5nzl5eu",
        json: replyJson,
        indexedAt: new Date(),
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(
        ctx,
        Post.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("subscribersがフォローしていないユーザーへのリプライは保存すべきでない", async () => {
      // arrange
      const subscriberActor = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriberActor })
        .create();

      const nonFolloweeActor = await actorFactory(ctx.db).create();
      const nonFolloweePost = await postFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "app.bsky.feed.post")
              .vars({ actor: () => nonFolloweeActor })
              .create(),
        })
        .props({
          text: () => "non-followee post",
        })
        .create();

      const replierActor = await actorFactory(ctx.db).create();

      const replyJson = {
        $type: "app.bsky.feed.post",
        text: "reply to non-followee post",
        reply: {
          parent: {
            uri: nonFolloweePost.uri,
            cid: nonFolloweePost.cid,
          },
          root: {
            uri: nonFolloweePost.uri,
            cid: nonFolloweePost.cid,
          },
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: `at://${replierActor.did}/app.bsky.feed.post/reply456`,
        cid: "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe",
        json: replyJson,
        indexedAt: new Date(),
      });

      // act
      const result = await postIndexingPolicy.shouldIndex(
        ctx,
        Post.from(record),
      );

      // assert
      expect(result).toBe(false);
    });
  });
});
