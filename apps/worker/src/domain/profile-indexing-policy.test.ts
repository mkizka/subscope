import type { TransactionContext } from "@repo/common/domain";
import { Profile, Record } from "@repo/common/domain";
import {
  actorFactory,
  recordFactory,
  setupTestDatabase,
  subscriptionFactory,
} from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { ProfileIndexingPolicy } from "./profile-indexing-policy.js";

let profileIndexingPolicy: ProfileIndexingPolicy;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  profileIndexingPolicy = testSetup.testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(ProfileIndexingPolicy);
  ctx = testSetup.ctx;
});

describe("ProfileIndexingPolicy", () => {
  describe("shouldIndex", () => {
    it("プロフィール作成者がsubscriberの場合は保存すべき", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:subscriber",
          handle: () => "subscriber.bsky.social",
        })
        .create();

      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => actor })
        .props({
          uri: () => "at://did:plc:subscriber/dev.mkizka.test.subscription/123",
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
      const record = Record.fromJson({
        uri: "at://did:plc:subscriber/app.bsky.actor.profile/self",
        cid: "profile123",
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
      await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:unrelated",
          handle: () => "unrelated.bsky.social",
        })
        .create();

      const profileJson = {
        $type: "app.bsky.actor.profile",
        displayName: "Unrelated User",
        description: "Unrelated description",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:unrelated/app.bsky.actor.profile/self",
        cid: "profile456",
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
