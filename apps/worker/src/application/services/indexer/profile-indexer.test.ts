import type { TransactionContext } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  actorFactory,
  recordFactory,
  setupTestDatabase,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { ProfileIndexingPolicy } from "../../../domain/profile-indexing-policy.js";
import { ProfileRepository } from "../../../infrastructure/profile-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { ProfileIndexer } from "./profile-indexer.js";

let profileIndexer: ProfileIndexer;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  profileIndexer = testSetup.testInjector
    .provideClass("profileRepository", ProfileRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("profileIndexingPolicy", ProfileIndexingPolicy)
    .injectClass(ProfileIndexer);
  ctx = testSetup.ctx;
});

describe("ProfileIndexer", () => {
  describe("upsert", () => {
    it("プロフィールレコードを正しく保存する", async () => {
      // Arrange
      const actor = await actorFactory(ctx.db)
        .props({
          did: () => "did:plc:user",
          handle: () => "user.bsky.social",
        })
        .create();

      const profileJson = {
        $type: "app.bsky.actor.profile",
        displayName: "Test User",
        description: "Test description",
        createdAt: new Date().toISOString(),
      };
      await recordFactory(ctx.db, "app.bsky.actor.profile")
        .vars({ actor: () => actor })
        .props({
          uri: () => "at://did:plc:user/app.bsky.actor.profile/self",
          cid: () => "profile123",
          json: () => profileJson,
        })
        .create();
      const record = Record.fromJson({
        uri: "at://did:plc:user/app.bsky.actor.profile/self",
        cid: "profile123",
        json: profileJson,
      });

      // Act
      await profileIndexer.upsert({ ctx, record });

      // Assert
      const profiles = await ctx.db
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.uri, record.uri.toString()))
        .limit(1);
      expect(profiles.length).toBe(1);
      expect(profiles[0]?.actorDid).toBe("did:plc:user");
      expect(profiles[0]?.displayName).toBe("Test User");
      expect(profiles[0]?.description).toBe("Test description");
    });
  });
});
