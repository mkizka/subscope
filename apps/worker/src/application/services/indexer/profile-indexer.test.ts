import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { actorFactory, getTestSetup, recordFactory } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { ProfileIndexingPolicy } from "../../../domain/profile-indexing-policy.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { ProfileIndexer } from "./profile-indexer.js";

describe("ProfileIndexer", () => {
  const { testInjector, ctx } = getTestSetup();

  const profileIndexer = testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("profileIndexingPolicy", ProfileIndexingPolicy)
    .injectClass(ProfileIndexer);

  describe("upsert", () => {
    it("プロフィールレコードを正しく保存する", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();

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
        .vars({ actor: () => actor })
        .props({
          uri: () => `at://${actor.did}/app.bsky.actor.profile/self`,
          cid: () => "profile123",
          json: () => profileJson,
        })
        .create();
      const record = Record.fromJson({
        uri: profileRecord.uri,
        cid: profileRecord.cid,
        json: profileJson,
        indexedAt: new Date(),
      });

      // act
      await profileIndexer.upsert({ ctx, record });

      // assert
      const profiles = await ctx.db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.uri, record.uri.toString()))
        .limit(1);
      expect(profiles.length).toBe(1);
      expect(profiles[0]?.actorDid).toBe(actor.did);
      expect(profiles[0]?.displayName).toBe("Test User");
      expect(profiles[0]?.description).toBe("Test description");
    });
  });
});
