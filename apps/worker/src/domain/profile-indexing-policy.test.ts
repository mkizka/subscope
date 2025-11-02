import { Profile, Record } from "@repo/common/domain";
import {
  actorFactory,
  followFactory,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { SubscriptionRepository } from "../infrastructure/repositories/subscription-repository.js";
import { ProfileIndexingPolicy } from "./profile-indexing-policy.js";

describe("ProfileIndexingPolicy", () => {
  const { testInjector, ctx } = testSetup;

  const profileIndexingPolicy = testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(ProfileIndexingPolicy);

  describe("shouldIndex", () => {
    test("プロフィール作成者がsubscriberの場合は保存すべき", async () => {
      // arrange
      const subscriberActor = await actorFactory(ctx.db)
        .use((t) => t.subscriber())
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
        indexedAt: new Date(),
      });

      // act
      const result = await profileIndexingPolicy.shouldIndex(
        ctx,
        Profile.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("プロフィール作成者がsubscriberでない場合は保存すべきでない", async () => {
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
        indexedAt: new Date(),
      });

      // act
      const result = await profileIndexingPolicy.shouldIndex(
        ctx,
        Profile.from(record),
      );

      // assert
      expect(result).toBe(false);
    });

    test("プロフィール作成者が追跡アカウント(サブスクライバーがフォローしているアカウント)の場合は保存すべき", async () => {
      // arrange
      const subscriberActor = await actorFactory(ctx.db)
        .use((t) => t.subscriber())
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

      const profileJson = {
        $type: "app.bsky.actor.profile",
        displayName: "Followee User",
        description: "Followee description",
        createdAt: new Date().toISOString(),
      };
      const profileRecord = await recordFactory(
        ctx.db,
        "app.bsky.actor.profile",
      )
        .vars({ actor: () => followeeActor })
        .props({ json: () => profileJson })
        .create();
      const record = Record.fromJson({
        uri: profileRecord.uri,
        cid: profileRecord.cid,
        json: profileJson,
        indexedAt: new Date(),
      });

      // act
      const result = await profileIndexingPolicy.shouldIndex(
        ctx,
        Profile.from(record),
      );

      // assert
      expect(result).toBe(true);
    });
  });
});
