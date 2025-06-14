import type { TransactionContext } from "@repo/common/domain";
import { Record, Subscription } from "@repo/common/domain";
import { setupTestDatabase } from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

import { env } from "../shared/env.js";
import { SubscriptionIndexingPolicy } from "./subscription-indexing-policy.js";

let subscriptionIndexingPolicy: SubscriptionIndexingPolicy;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  subscriptionIndexingPolicy = testSetup.testInjector.injectClass(
    SubscriptionIndexingPolicy,
  );
  ctx = testSetup.ctx;
});

describe("SubscriptionIndexingPolicy", () => {
  describe("shouldIndex", () => {
    it("appviewDidが環境変数のAPPVIEW_DIDと一致する場合はtrueを返すべき", async () => {
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
      });

      // Act
      const result = await subscriptionIndexingPolicy.shouldIndex(
        ctx,
        Subscription.from(record),
      );

      // Assert
      expect(result).toBe(true);
    });

    it("appviewDidが環境変数のAPPVIEW_DIDと一致しない場合はfalseを返すべき", async () => {
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
