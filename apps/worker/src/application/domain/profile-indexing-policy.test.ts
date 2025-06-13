import type { TransactionContext } from "@repo/common/domain";
import { Profile, Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

import { SubscriptionRepository } from "../../infrastructure/subscription-repository.js";
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
      // Arrange
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:subscriber",
        handle: "subscriber.bsky.social",
      });

      // subscriberとして登録
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:subscriber/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:subscriber",
        json: {
          $type: "dev.mkizka.test.subscription",
          appviewDid: "did:web:appview.test",
          createdAt: new Date().toISOString(),
        },
      });
      await ctx.db.insert(schema.subscriptions).values({
        uri: "at://did:plc:subscriber/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:subscriber",
        appviewDid: "did:web:appview.test",
        createdAt: new Date(),
      });

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

      // Act
      const result = await profileIndexingPolicy.shouldIndex(
        ctx,
        Profile.from(record),
      );

      // Assert
      expect(result).toBe(true);
    });

    it("プロフィール作成者がsubscriberでない場合は保存すべきでない", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:unrelated",
        handle: "unrelated.bsky.social",
      });

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

      // Act
      const result = await profileIndexingPolicy.shouldIndex(
        ctx,
        Profile.from(record),
      );

      // Assert
      expect(result).toBe(false);
    });
  });
});
