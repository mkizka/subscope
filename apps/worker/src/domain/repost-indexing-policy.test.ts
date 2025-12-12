import { Repost } from "@repo/common/domain";
import { fakeCid, recordFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../shared/test-utils.js";
import { RepostIndexingPolicy } from "./repost-indexing-policy.js";

describe("RepostIndexingPolicy", () => {
  const repostIndexingPolicy = testInjector.injectClass(RepostIndexingPolicy);

  const indexTargetRepo = testInjector.resolve("indexTargetRepository");

  describe("shouldIndex", () => {
    test("repost者がsubscriberの場合は保存すべき", async () => {
      // arrange
      const reposterDid = "did:plc:reposter123";
      const authorDid = "did:plc:author456";

      await indexTargetRepo.addSubscriber(reposterDid);
      await indexTargetRepo.addTrackedActor(reposterDid);

      const record = recordFactory({
        uri: `at://${reposterDid}/app.bsky.feed.repost/123`,
        json: {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: `at://${authorDid}/app.bsky.feed.post/456`,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await repostIndexingPolicy.shouldIndex(
        Repost.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("repost者のフォロワーがsubscriberの場合は保存すべき", async () => {
      // arrange
      const reposterDid = "did:plc:reposter123";
      const subscriberDid = "did:plc:subscriber456";
      const authorDid = "did:plc:author789";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);
      await indexTargetRepo.addTrackedActor(reposterDid);

      const record = recordFactory({
        uri: `at://${reposterDid}/app.bsky.feed.repost/321`,
        json: {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: `at://${authorDid}/app.bsky.feed.post/654`,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await repostIndexingPolicy.shouldIndex(
        Repost.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("subscribersの投稿へのリポストは保存すべき", async () => {
      // arrange
      const reposterDid = "did:plc:reposter123";
      const subscriberDid = "did:plc:subscriber456";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);

      const record = recordFactory({
        uri: `at://${reposterDid}/app.bsky.feed.repost/789`,
        json: {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: `at://${subscriberDid}/app.bsky.feed.post/post123`,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await repostIndexingPolicy.shouldIndex(
        Repost.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("repost者もフォロワーもsubscriberでない場合は保存すべきでない", async () => {
      // arrange
      const reposterDid = "did:plc:reposter123";
      const authorDid = "did:plc:author456";

      const record = recordFactory({
        uri: `at://${reposterDid}/app.bsky.feed.repost/888`,
        json: {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: `at://${authorDid}/app.bsky.feed.post/999`,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await repostIndexingPolicy.shouldIndex(
        Repost.from(record),
      );

      // assert
      expect(result).toBe(false);
    });

    test("追跡アクターの投稿へのリポストは保存すべき", async () => {
      // arrange
      const reposterDid = "did:plc:reposter123";
      const subscriberDid = "did:plc:subscriber456";
      const followeeDid = "did:plc:followee789";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);
      await indexTargetRepo.addTrackedActor(followeeDid);

      const record = recordFactory({
        uri: `at://${reposterDid}/app.bsky.feed.repost/789`,
        json: {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: `at://${followeeDid}/app.bsky.feed.post/post123`,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await repostIndexingPolicy.shouldIndex(
        Repost.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("subscribersがフォローしていないユーザーの投稿へのリポストは保存すべきでない", async () => {
      // arrange
      const reposterDid = "did:plc:reposter123";
      const subscriberDid = "did:plc:subscriber456";
      const nonFolloweeDid = "did:plc:nonfollowee789";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);

      const record = recordFactory({
        uri: `at://${reposterDid}/app.bsky.feed.repost/999`,
        json: {
          $type: "app.bsky.feed.repost",
          subject: {
            uri: `at://${nonFolloweeDid}/app.bsky.feed.post/post123`,
            cid: fakeCid(),
          },
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await repostIndexingPolicy.shouldIndex(
        Repost.from(record),
      );

      // assert
      expect(result).toBe(false);
    });
  });
});
