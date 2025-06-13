import type { TransactionContext } from "@repo/common/domain";
import { Record, Subscription } from "@repo/common/domain";
import { setupTestDatabase } from "@repo/test-utils";
import { beforeAll, describe, expect, it } from "vitest";

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
    it("サブスクリプションレコードは常に保存すべき", async () => {
      // Arrange
      const subscriptionJson = {
        $type: "dev.mkizka.test.subscription",
        appviewDid: "did:web:appview.test",
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
  });
});
