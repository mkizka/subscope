import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import { actorFactory, getTestSetup, recordFactory } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import { SubscriptionIndexingPolicy } from "../../../domain/subscription-indexing-policy.js";
import { ActorRepository } from "../../../infrastructure/actor-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/subscription-repository.js";
import { env } from "../../../shared/env.js";
import type { BackfillScheduler } from "../scheduler/backfill-scheduler.js";
import { SubscriptionIndexer } from "./subscription-indexer.js";

const mockBackfillScheduler = mockDeep<BackfillScheduler>();
const { testInjector, ctx } = getTestSetup();

const subscriptionIndexer = testInjector
  .provideClass("subscriptionRepository", SubscriptionRepository)
  .provideClass("actorRepository", ActorRepository)
  .provideValue("backfillScheduler", mockBackfillScheduler)
  .provideClass("subscriptionIndexingPolicy", SubscriptionIndexingPolicy)
  .injectClass(SubscriptionIndexer);

describe("SubscriptionIndexer", () => {
  describe("upsert", () => {
    it("サブスクリプションレコードをupsertする場合、subscriptionsテーブルに保存する", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => actor })
        .props({
          json: () => ({
            $type: "dev.mkizka.test.subscription",
            appviewDid: env.APPVIEW_DID,
            createdAt: new Date().toISOString(),
          }),
        })
        .create();
      const record = Record.fromJson({
        uri: subscriptionRecord.uri,
        cid: subscriptionRecord.cid,
        json: subscriptionRecord.json,
      });

      // act
      await subscriptionIndexer.upsert({ ctx, record });

      // assert
      const [subscription] = await ctx.db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.uri, record.uri.toString()))
        .limit(1);
      expect(subscription).toMatchObject({
        uri: record.uri.toString(),
        cid: record.cid.toString(),
        actorDid: actor.did,
        appviewDid: env.APPVIEW_DID,
      });
    });

    it("actorのbackfillStatusがdirtyの場合、backfillSchedulerでスケジュールする", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .props({ backfillStatus: () => "dirty" })
        .create();
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => actor })
        .props({
          json: () => ({
            $type: "dev.mkizka.test.subscription",
            appviewDid: env.APPVIEW_DID,
            createdAt: new Date().toISOString(),
          }),
        })
        .create();
      const record = Record.fromJson({
        uri: subscriptionRecord.uri,
        cid: subscriptionRecord.cid,
        json: subscriptionRecord.json,
      });

      // act
      await subscriptionIndexer.upsert({ ctx, record });

      // assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockBackfillScheduler.schedule).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockBackfillScheduler.schedule).toHaveBeenCalledWith(actor.did);
    });

    it("actorのbackfillStatusがsynchronizedの場合、backfillSchedulerは呼ばれない", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .props({ backfillStatus: () => "synchronized" })
        .create();
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .vars({ actor: () => actor })
        .props({
          json: () => ({
            $type: "dev.mkizka.test.subscription",
            appviewDid: env.APPVIEW_DID,
            createdAt: new Date().toISOString(),
          }),
        })
        .create();
      const record = Record.fromJson({
        uri: subscriptionRecord.uri,
        cid: subscriptionRecord.cid,
        json: subscriptionRecord.json,
      });

      // act
      await subscriptionIndexer.upsert({ ctx, record });

      // assert
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockBackfillScheduler.schedule).not.toHaveBeenCalled();
    });
  });

  describe("shouldIndex", () => {
    it("appviewDidが環境変数APPVIEW_DIDと一致する場合、trueを返す", async () => {
      // arrange
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .props({
          json: () => ({
            $type: "dev.mkizka.test.subscription",
            appviewDid: env.APPVIEW_DID,
            createdAt: new Date().toISOString(),
          }),
        })
        .create();
      const record = Record.fromJson({
        uri: subscriptionRecord.uri,
        cid: subscriptionRecord.cid,
        json: subscriptionRecord.json,
      });

      // act
      const result = await subscriptionIndexer.shouldIndex({ ctx, record });

      // assert
      expect(result).toBe(true);
    });

    it("appviewDidが環境変数APPVIEW_DIDと一致しない場合、falseを返す", async () => {
      // arrange
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "dev.mkizka.test.subscription",
      )
        .props({
          json: () => ({
            $type: "dev.mkizka.test.subscription",
            appviewDid: "did:web:other.appview.test",
            createdAt: new Date().toISOString(),
          }),
        })
        .create();
      const record = Record.fromJson({
        uri: subscriptionRecord.uri,
        cid: subscriptionRecord.cid,
        json: subscriptionRecord.json,
      });

      // act
      const result = await subscriptionIndexer.shouldIndex({ ctx, record });

      // assert
      expect(result).toBe(false);
    });
  });
});
