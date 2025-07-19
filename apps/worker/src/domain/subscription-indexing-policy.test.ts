import { Record, Subscription } from "@repo/common/domain";
import { getTestSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { env } from "../shared/env.js";
import { SubscriptionIndexingPolicy } from "./subscription-indexing-policy.js";

describe("SubscriptionIndexingPolicy", () => {
  const { testInjector, ctx } = getTestSetup();

  const subscriptionIndexingPolicy = testInjector.injectClass(
    SubscriptionIndexingPolicy,
  );

  describe("shouldIndex", () => {
    test("appviewDidが環境変数のAPPVIEW_DIDと一致する場合はtrueを返すべき", async () => {
      // Arrange
      const subscriptionJson = {
        $type: "dev.mkizka.test.subscription",
        appviewDid: env.APPVIEW_DID,
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:user/dev.mkizka.test.subscription/123",
        cid: "sub123",
        json: subscriptionJson,
        indexedAt: new Date(),
      });

      // Act
      const result = await subscriptionIndexingPolicy.shouldIndex(
        ctx,
        Subscription.from(record),
      );

      // Assert
      expect(result).toBe(true);
    });

    test("appviewDidが環境変数のAPPVIEW_DIDと一致しない場合はfalseを返すべき", async () => {
      // Arrange
      const subscriptionJson = {
        $type: "dev.mkizka.test.subscription",
        appviewDid: "did:web:other.appview.test",
        createdAt: new Date().toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:user/dev.mkizka.test.subscription/123",
        cid: "sub123",
        json: subscriptionJson,
        indexedAt: new Date(),
      });

      // Act
      const result = await subscriptionIndexingPolicy.shouldIndex(
        ctx,
        Subscription.from(record),
      );

      // Assert
      expect(result).toBe(false);
    });
  });
});
