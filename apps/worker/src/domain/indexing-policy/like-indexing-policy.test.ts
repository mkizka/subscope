import { Like } from "@repo/common/domain";
import { fakeCid, recordFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../shared/test-utils.js";
import { LikeIndexingPolicy } from "./like-indexing-policy.js";

describe("LikeIndexingPolicy", () => {
  const likeIndexingPolicy = testInjector.injectClass(LikeIndexingPolicy);

  const indexTargetRepo = testInjector.resolve("indexTargetRepository");

  describe("shouldIndex", () => {
    test("subscriberのいいねは保存すべき", async () => {
      // arrange
      const subscriberDid = "did:plc:subscriber123";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);

      const record = recordFactory({
        uri: `at://${subscriberDid}/app.bsky.feed.like/like123`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: "at://did:plc:other/app.bsky.feed.post/123",
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await likeIndexingPolicy.shouldIndex(Like.from(record));

      // assert
      expect(result).toBe(true);
    });

    test("subscribersの投稿へのいいねは保存すべき", async () => {
      // arrange
      const likerDid = "did:plc:liker123";
      const subscriberDid = "did:plc:subscriber456";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);

      const record = recordFactory({
        uri: `at://${likerDid}/app.bsky.feed.like/like123`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: `at://${subscriberDid}/app.bsky.feed.post/post123`,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await likeIndexingPolicy.shouldIndex(Like.from(record));

      // assert
      expect(result).toBe(true);
    });

    test("subscriberでもなく、追跡アクターでもない投稿へのいいねは保存すべきでない", async () => {
      // arrange
      const unrelatedDid = "did:plc:unrelated123";

      const record = recordFactory({
        uri: `at://${unrelatedDid}/app.bsky.feed.like/like123`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: "at://did:plc:ghost/app.bsky.feed.post/ghost123",
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await likeIndexingPolicy.shouldIndex(Like.from(record));

      // assert
      expect(result).toBe(false);
    });

    test("追跡アクターの投稿へのいいねは保存すべき", async () => {
      // arrange
      const likerDid = "did:plc:liker123";
      const subscriberDid = "did:plc:subscriber456";
      const followeeDid = "did:plc:followee789";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);
      await indexTargetRepo.addTrackedActor(followeeDid);

      const record = recordFactory({
        uri: `at://${likerDid}/app.bsky.feed.like/like123`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: `at://${followeeDid}/app.bsky.feed.post/post123`,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await likeIndexingPolicy.shouldIndex(Like.from(record));

      // assert
      expect(result).toBe(true);
    });

    test("subscribersがフォローしていないユーザーの投稿へのいいねは保存すべきでない", async () => {
      // arrange
      const likerDid = "did:plc:liker123";
      const subscriberDid = "did:plc:subscriber456";
      const nonFolloweeDid = "did:plc:nonfollowee789";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);

      const record = recordFactory({
        uri: `at://${likerDid}/app.bsky.feed.like/like123`,
        json: {
          $type: "app.bsky.feed.like",
          subject: {
            uri: `at://${nonFolloweeDid}/app.bsky.feed.post/post123`,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await likeIndexingPolicy.shouldIndex(Like.from(record));

      // assert
      expect(result).toBe(false);
    });
  });
});
