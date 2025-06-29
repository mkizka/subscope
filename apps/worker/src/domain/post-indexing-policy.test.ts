import type { TransactionContext } from "@repo/common/domain";
import { Post, Record } from "@repo/common/domain";
import {
  actorFactory,
  followFactory,
  postFactory,
  recordFactory,
  setupTestDatabase,
  subscriptionFactory,
} from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

import { PostRepository } from "../infrastructure/post-repository.js";
import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { PostIndexingPolicy } from "./post-indexing-policy.js";

let postIndexingPolicy: PostIndexingPolicy;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  postIndexingPolicy = testSetup.testInjector
    .provideClass("postRepository", PostRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(PostIndexingPolicy);
  ctx = testSetup.ctx;
});

describe("PostIndexingPolicy", () => {
  describe("shouldIndex", () => {
    it("subscriberの投稿は保存すべき", async () => {
      // arrange
      const subscriberActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:subscriber",
          handle: () => "subscriber.bsky.social",
        })
        .create();
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
        uri: "at://did:plc:subscriber/app.bsky.feed.post/123",
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
      const subscriberActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:subscriber2",
          handle: () => "subscriber2.bsky.social",
        })
        .create();
      await subscriptionFactory(ctx.db)
        .vars({
          record: () =>
            recordFactory(ctx.db, "dev.mkizka.test.subscription")
              .vars({ actor: () => subscriberActor })
              .create(),
        })
        .create();

      const followedActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:followed",
          handle: () => "followed.bsky.social",
        })
        .create();

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
        uri: "at://did:plc:followed/app.bsky.feed.post/123",
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

    it("DBに存在する投稿への返信は保存すべき", async () => {
      // arrange
      const originalPosterActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:originalPoster",
          handle: () => "original.bsky.social",
        })
        .create();
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

      const replierActor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:replier",
          handle: () => "replier.bsky.social",
        })
        .create();

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
        uri: "at://did:plc:replier/app.bsky.feed.post/reply123",
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
      await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:unrelated",
          handle: () => "unrelated.bsky.social",
        })
        .create();

      const postJson = {
        $type: "app.bsky.feed.post",
        text: "unrelated post",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:unrelated/app.bsky.feed.post/123",
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
      await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:replier2",
          handle: () => "replier2.bsky.social",
        })
        .create();

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
        uri: "at://did:plc:replier2/app.bsky.feed.post/reply456",
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
