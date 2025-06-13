import type { TransactionContext } from "@repo/common/domain";
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { setupTestDatabase } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import { ActorRepository } from "../../../infrastructure/actor-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { SubscriptionIndexingPolicy } from "../../domain/subscription-indexing-policy.js";
import type { BackfillService } from "../scheduler/backfill-service.js";
import { SubscriptionIndexer } from "./subscription-indexer.js";

let subscriptionIndexer: SubscriptionIndexer;
let ctx: TransactionContext;

const { getSetup } = setupTestDatabase();

beforeAll(() => {
  const testSetup = getSetup();
  subscriptionIndexer = testSetup.testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("actorRepository", ActorRepository)
    .provideValue("backfillService", mockDeep<BackfillService>())
    .provideClass("subscriptionIndexingPolicy", SubscriptionIndexingPolicy)
    .injectClass(SubscriptionIndexer);
  ctx = testSetup.ctx;
});

describe("SubscriptionIndexer", () => {
  describe("upsert", () => {
    it("サブスクリプションレコードを正しく保存する", async () => {
      // Arrange
      await ctx.db.insert(schema.actors).values({
        did: "did:plc:subscriber",
        handle: "subscriber.bsky.social",
      });

      const subscriptionJson = {
        $type: "dev.mkizka.test.subscription",
        appviewDid: "did:web:appview.test",
        createdAt: new Date().toISOString(),
      };
      await ctx.db.insert(schema.records).values({
        uri: "at://did:plc:subscriber/dev.mkizka.test.subscription/123",
        cid: "sub123",
        actorDid: "did:plc:subscriber",
        json: subscriptionJson,
      });
      const record = Record.fromJson({
        uri: "at://did:plc:subscriber/dev.mkizka.test.subscription/123",
        cid: "sub123",
        json: subscriptionJson,
      });

      // Act
      await subscriptionIndexer.upsert({ ctx, record });

      // Assert
      const subscriptions = await ctx.db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.uri, record.uri.toString()))
        .limit(1);
      expect(subscriptions.length).toBe(1);
      expect(subscriptions[0]?.actorDid).toBe("did:plc:subscriber");
      expect(subscriptions[0]?.appviewDid).toBe("did:web:appview.test");
    });
  });
});
