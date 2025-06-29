import { Profile, Record } from "@repo/common/domain";
import {
  actorFactory,
  getTestSetup,
  recordFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { describe, expect, it } from "vitest";

import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { ProfileIndexingPolicy } from "./profile-indexing-policy.js";

const { testInjector, ctx } = getTestSetup();

const profileIndexingPolicy = testInjector
  .provideClass("subscriptionRepository", SubscriptionRepository)
  .injectClass(ProfileIndexingPolicy);

describe("ProfileIndexingPolicy", () => {
  describe("shouldIndex", () => {
    it("プロフィール作成者がsubscriberの場合は保存すべき", async () => {
      // arrange
      const subscriberActor = await actorFactory(ctx.db).create();

      // subscriberとして登録
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => subscriberActor })
        .props({
          uri: () =>
            `at://${subscriberActor.did}/dev.mkizka.test.subscription/123`,
          cid: () => "sub123",
          json: () => ({
            $type: "dev.mkizka.test.subscription",
            appviewDid: "did:web:appview.test",
            createdAt: new Date().toISOString(),
          }),
        })
        .create();
      await subscriptionFactory(ctx.db)
        .vars({ record: () => subscriptionRecord })
        .create();

      const profileJson = {
        $type: "app.bsky.actor.profile",
        displayName: "Test User",
        description: "Test description",
        createdAt: new Date().toISOString(),
      };
      const profileRecord = await recordFactory(
        ctx.db,
        "app.bsky.actor.profile",
      )
        .vars({ actor: () => subscriberActor })
        .props({ json: () => profileJson })
        .create();
      const record = Record.fromJson({
        uri: profileRecord.uri,
        cid: profileRecord.cid,
        json: profileJson,
      });

      // act
      const result = await profileIndexingPolicy.shouldIndex(
        ctx,
        Profile.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    it("プロフィール作成者がsubscriberでない場合は保存すべきでない", async () => {
      // arrange
      const unrelatedActor = await actorFactory(ctx.db).create();

      const profileJson = {
        $type: "app.bsky.actor.profile",
        displayName: "Unrelated User",
        description: "Unrelated description",
        createdAt: new Date().toISOString(),
      };
      const profileRecord = await recordFactory(
        ctx.db,
        "app.bsky.actor.profile",
      )
        .vars({ actor: () => unrelatedActor })
        .props({ json: () => profileJson })
        .create();
      const record = Record.fromJson({
        uri: profileRecord.uri,
        cid: profileRecord.cid,
        json: profileJson,
      });

      // act
      const result = await profileIndexingPolicy.shouldIndex(
        ctx,
        Profile.from(record),
      );

      // assert
      expect(result).toBe(false);
    });
  });
});
