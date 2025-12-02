import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  actorFactory,
  randomCid,
  recordFactory,
  testSetup,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { ProfileIndexingPolicy } from "../../../domain/profile-indexing-policy.js";
import { PostgresIndexTargetRepository } from "../../../infrastructure/repositories/index-target-repository/postgres-index-target-repository.js";
import { ProfileRepository } from "../../../infrastructure/repositories/profile-repository/profile-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/repositories/subscription-repository/subscription-repository.js";
import { TrackedActorChecker } from "../../../infrastructure/repositories/tracked-actor-checker/tracked-actor-checker.js";
import { ProfileIndexer } from "./profile-indexer.js";

describe("ProfileIndexer", () => {
  const { testInjector, ctx } = testSetup;

  const profileIndexer = testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("trackedActorChecker", TrackedActorChecker)
    .provideClass("indexTargetRepository", PostgresIndexTargetRepository)
    .provideClass("profileIndexingPolicy", ProfileIndexingPolicy)
    .injectClass(ProfileIndexer);

  describe("upsert", () => {
    test("プロフィールレコードを正しく保存する", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const avatarCid = await randomCid();
      const bannerCid = await randomCid();

      const profileJson = {
        $type: "app.bsky.actor.profile",
        displayName: "Test User",
        description: "Test description",
        avatar: {
          $type: "blob",
          ref: { $link: avatarCid },
          mimeType: "image/jpeg",
          size: 1000,
        },
        banner: {
          $type: "blob",
          ref: { $link: bannerCid },
          mimeType: "image/jpeg",
          size: 2000,
        },
        createdAt: new Date().toISOString(),
      };
      const profileRecord = await recordFactory(
        ctx.db,
        "app.bsky.actor.profile",
      )
        .vars({ actor: () => actor })
        .props({
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
      expect(profiles).toHaveLength(1);
      expect(profiles[0]).toMatchObject({
        actorDid: actor.did,
        displayName: "Test User",
        description: "Test description",
        avatarCid,
        bannerCid,
      });
    });
  });
});
