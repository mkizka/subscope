import { Profile } from "@repo/common/domain";
import { recordFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../shared/test-utils.js";
import { ProfileIndexingPolicy } from "./profile-indexing-policy.js";

describe("ProfileIndexingPolicy", () => {
  const profileIndexingPolicy = testInjector.injectClass(ProfileIndexingPolicy);

  const indexTargetRepo = testInjector.resolve("indexTargetRepository");

  describe("shouldIndex", () => {
    test("プロフィール作成者がsubscriberの場合は保存すべき", async () => {
      // arrange
      const subscriberDid = "did:plc:subscriber123";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);

      const record = recordFactory({
        uri: `at://${subscriberDid}/app.bsky.actor.profile/self`,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Test User",
          description: "Test description",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await profileIndexingPolicy.shouldIndex(
        Profile.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("プロフィール作成者がsubscriberでない場合は保存すべきでない", async () => {
      // arrange
      const unrelatedDid = "did:plc:unrelated123";

      const record = recordFactory({
        uri: `at://${unrelatedDid}/app.bsky.actor.profile/self`,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Unrelated User",
          description: "Unrelated description",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await profileIndexingPolicy.shouldIndex(
        Profile.from(record),
      );

      // assert
      expect(result).toBe(false);
    });

    test("プロフィール作成者が追跡アクター(サブスクライバーまたはサブスクライバーのフォロイー)の場合は保存すべき", async () => {
      // arrange
      const subscriberDid = "did:plc:subscriber123";
      const followeeDid = "did:plc:followee456";

      await indexTargetRepo.addSubscriber(subscriberDid);
      await indexTargetRepo.addTrackedActor(subscriberDid);
      await indexTargetRepo.addTrackedActor(followeeDid);

      const record = recordFactory({
        uri: `at://${followeeDid}/app.bsky.actor.profile/self`,
        json: {
          $type: "app.bsky.actor.profile",
          displayName: "Followee User",
          description: "Followee description",
          createdAt: new Date().toISOString(),
        },
      });

      // act
      const result = await profileIndexingPolicy.shouldIndex(
        Profile.from(record),
      );

      // assert
      expect(result).toBe(true);
    });
  });
});
