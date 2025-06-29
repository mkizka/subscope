import type { TransactionContext } from "@repo/common/domain";
import { Like, Record } from "@repo/common/domain";
import {
  actorFactory,
  postFactory,
  recordFactory,
  setupTestDatabase,
  subscriptionFactory,
} from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

import { PostRepository } from "../infrastructure/post-repository.js";
import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { LikeIndexingPolicy } from "./like-indexing-policy.js";

let likeIndexingPolicy: LikeIndexingPolicy;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  likeIndexingPolicy = testSetup.testInjector
    .provideClass("postRepository", PostRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(LikeIndexingPolicy);
  ctx = testSetup.ctx;
});

describe("LikeIndexingPolicy", () => {
  describe("shouldIndex", () => {
    it("subscriberのいいねは保存すべき", async () => {
      // arrange
      const subscriber = await actorFactory(ctx.db).create();
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => subscriber })
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
      const record = Record.fromJson({
        uri: `at://${subscriber.did}/app.bsky.feed.like/123`,
        cid: "abc123",
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
      const liker = await actorFactory(ctx.db).create();
      const post = await postFactory(ctx.db).create();

      const likeJson = {
        $type: "app.bsky.feed.like",
        subject: {
          uri: post.uri,
          cid: post.cid,
        },
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: `at://${liker.did}/app.bsky.feed.like/123`,
        cid: "like123",
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
      const record = Record.fromJson({
        uri: `at://${unrelatedActor.did}/app.bsky.feed.like/123`,
        cid: "like123",
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
