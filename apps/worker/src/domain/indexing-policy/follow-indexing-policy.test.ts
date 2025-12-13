import { Follow } from "@repo/common/domain";
import { recordFactory, subscriptionFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../shared/test-utils.js";
import { FollowIndexingPolicy } from "./follow-indexing-policy.js";

describe("FollowIndexingPolicy", () => {
  const followIndexingPolicy = testInjector.injectClass(FollowIndexingPolicy);

  const subscriptionRepo = testInjector.resolve("subscriptionRepository");

  const ctx = {
    db: testInjector.resolve("db"),
  };

  describe("shouldIndex", () => {
    test("フォロワーがsubscriberの場合は保存すべき", async () => {
      // arrange
      const followerDid = "did:plc:follower123";
      const followeeDid = "did:plc:followee456";

      const subscription = subscriptionFactory({ actorDid: followerDid });
      subscriptionRepo.add(subscription);

      const record = recordFactory({
        uri: `at://${followerDid}/app.bsky.graph.follow/followrkey123`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followeeDid,
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await followIndexingPolicy.shouldIndex(
        ctx,
        Follow.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("フォロイーがsubscriberの場合は保存すべき", async () => {
      // arrange
      const followerDid = "did:plc:follower123";
      const followeeDid = "did:plc:followee456";

      const subscription = subscriptionFactory({ actorDid: followeeDid });
      subscriptionRepo.add(subscription);

      const record = recordFactory({
        uri: `at://${followerDid}/app.bsky.graph.follow/followrkey123`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followeeDid,
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await followIndexingPolicy.shouldIndex(
        ctx,
        Follow.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("フォロワーもフォロイーもsubscriberでない場合は保存すべきでない", async () => {
      // arrange
      const followerDid = "did:plc:follower123";
      const followeeDid = "did:plc:followee456";

      const record = recordFactory({
        uri: `at://${followerDid}/app.bsky.graph.follow/followrkey123`,
        json: {
          $type: "app.bsky.graph.follow",
          subject: followeeDid,
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await followIndexingPolicy.shouldIndex(
        ctx,
        Follow.from(record),
      );

      // assert
      expect(result).toBe(false);
    });
  });
});
