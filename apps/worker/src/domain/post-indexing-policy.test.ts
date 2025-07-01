import { Post, Record } from "@repo/common/domain";
import {
  actorFactory,
  followFactory,
  getTestSetup,
  postFactory,
  recordFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { describe, expect, it } from "vitest";

import { PostRepository } from "../infrastructure/post-repository.js";
import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { PostIndexingPolicy } from "./post-indexing-policy.js";

describe("PostIndexingPolicy", () => {
  const { testInjector, ctx } = getTestSetup();

  describe("INDEX_LEVEL=1", () => {
    const postIndexingPolicy = testInjector
      .provideClass("postRepository", PostRepository)
      .provideClass("subscriptionRepository", SubscriptionRepository)
      .provideValue("indexLevel", 1)
      .injectClass(PostIndexingPolicy);

    describe("shouldIndex", () => {
      it("subscriberの投稿は保存すべき", async () => {
        // arrange
        const subscriberActor = await actorFactory(ctx.db).create();
        await subscriptionFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "dev.mkizka.test.subscription")
                .vars({ actor: () => subscriberActor })
                .create(),
          })
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
        });

        // act
        const result = await postIndexingPolicy.shouldIndex(
          ctx,
          Post.from(record),
        );

        // assert
        expect(result).toBe(true);
      });

      it("subscriberにフォローされているユーザーの投稿は保存すべき", async () => {
        // arrange
        const subscriberActor = await actorFactory(ctx.db).create();
        await subscriptionFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "dev.mkizka.test.subscription")
                .vars({ actor: () => subscriberActor })
                .create(),
          })
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
        });

        // act
        const result = await postIndexingPolicy.shouldIndex(
          ctx,
          Post.from(record),
        );

        // assert
        expect(result).toBe(true);
      });

      it("subscribersへのリプライは保存すべき", async () => {
        // arrange
        const subscriberActor = await actorFactory(ctx.db).create();
        await subscriptionFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "dev.mkizka.test.subscription")
                .vars({ actor: () => subscriberActor })
                .create(),
          })
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
        });

        // act
        const result = await postIndexingPolicy.shouldIndex(
          ctx,
          Post.from(record),
        );

        // assert
        expect(result).toBe(true);
      });

      it("subscriberでもフォロワーでもないユーザーの投稿は保存すべきでない", async () => {
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
        });

        // act
        const result = await postIndexingPolicy.shouldIndex(
          ctx,
          Post.from(record),
        );

        // assert
        expect(result).toBe(false);
      });

      it("DBに存在しない投稿への返信は保存すべきでない", async () => {
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

  describe("INDEX_LEVEL=2", () => {
    const postIndexingPolicyLevel2 = testInjector
      .provideClass("postRepository", PostRepository)
      .provideClass("subscriptionRepository", SubscriptionRepository)
      .provideValue("indexLevel", 2)
      .injectClass(PostIndexingPolicy);

    describe("shouldIndex", () => {
      it("INDEX_LEVEL=1の条件も満たす場合は保存すべき", async () => {
        // arrange
        const subscriberActor = await actorFactory(ctx.db).create();
        await subscriptionFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "dev.mkizka.test.subscription")
                .vars({ actor: () => subscriberActor })
                .create(),
          })
          .create();

        const postJson = {
          $type: "app.bsky.feed.post",
          text: "subscriber post",
          createdAt: new Date().toISOString(),
        };
        const record = Record.fromJson({
          uri: `at://${subscriberActor.did}/app.bsky.feed.post/123`,
          cid: "abc123",
          json: postJson,
        });

        // act
        const result = await postIndexingPolicyLevel2.shouldIndex(
          ctx,
          Post.from(record),
        );

        // assert
        expect(result).toBe(true);
      });

      it("保存された投稿へのリプライは保存すべき", async () => {
        // arrange
        const originalPosterActor = await actorFactory(ctx.db).create();
        const originalPost = await postFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.feed.post")
                .vars({ actor: () => originalPosterActor })
                .create(),
          })
          .props({
            text: () => "original post",
          })
          .create();

        const replierActor = await actorFactory(ctx.db).create();

        const replyJson = {
          $type: "app.bsky.feed.post",
          text: "reply to original post",
          reply: {
            parent: {
              uri: originalPost.uri,
              cid: originalPost.cid,
            },
            root: {
              uri: originalPost.uri,
              cid: originalPost.cid,
            },
          },
          createdAt: new Date().toISOString(),
        };
        const record = Record.fromJson({
          uri: `at://${replierActor.did}/app.bsky.feed.post/reply123`,
          cid: "bafyreihj7fbbzsqgahvoa4f5qhevzxvbcfi6mjlvvinjlfl3uvp5nzl5eu",
          json: replyJson,
        });

        // act
        const result = await postIndexingPolicyLevel2.shouldIndex(
          ctx,
          Post.from(record),
        );

        // assert
        expect(result).toBe(true);
      });

      it("INDEX_LEVEL=1では保存されない投稿へのリプライでも、INDEX_LEVEL=2では保存すべき", async () => {
        // arrange
        const nonSubscriberActor = await actorFactory(ctx.db).create();
        const nonSubscriberPost = await postFactory(ctx.db)
          .vars({
            record: () =>
              recordFactory(ctx.db, "app.bsky.feed.post")
                .vars({ actor: () => nonSubscriberActor })
                .create(),
          })
          .props({
            text: () => "non-subscriber post",
          })
          .create();

        const replierActor = await actorFactory(ctx.db).create();

        const replyJson = {
          $type: "app.bsky.feed.post",
          text: "reply to non-subscriber post",
          reply: {
            parent: {
              uri: nonSubscriberPost.uri,
              cid: nonSubscriberPost.cid,
            },
            root: {
              uri: nonSubscriberPost.uri,
              cid: nonSubscriberPost.cid,
            },
          },
          createdAt: new Date().toISOString(),
        };
        const record = Record.fromJson({
          uri: `at://${replierActor.did}/app.bsky.feed.post/reply456`,
          cid: "bafyreicv4fgoiinirjwcddwglcws5rujyqvdj4kz6w5typufhfztfb3ghe",
          json: replyJson,
        });

        // act
        const result = await postIndexingPolicyLevel2.shouldIndex(
          ctx,
          Post.from(record),
        );

        // assert
        expect(result).toBe(true);
      });
    });
  });
});
