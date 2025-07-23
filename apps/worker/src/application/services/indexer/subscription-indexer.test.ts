/* eslint-disable @typescript-eslint/unbound-method */
import { Record } from "@repo/common/domain";
import { schema } from "@repo/db";
import {
  actorFactory,
  getTestSetup,
  inviteCodeFactory,
  recordFactory,
} from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import { SubscriptionIndexingPolicy } from "../../../domain/subscription-indexing-policy.js";
import { ActorRepository } from "../../../infrastructure/repositories/actor-repository.js";
import { InviteCodeRepository } from "../../../infrastructure/repositories/invite-code-repository.js";
import { SubscriptionRepository } from "../../../infrastructure/repositories/subscription-repository.js";
import { env } from "../../../shared/env.js";
import type { BackfillScheduler } from "../scheduler/backfill-scheduler.js";
import { SubscriptionIndexer } from "./subscription-indexer.js";

describe("SubscriptionIndexer", () => {
  const mockBackfillScheduler = mockDeep<BackfillScheduler>();
  const { testInjector, ctx } = getTestSetup();
  const fakeDate = new Date("2024-01-01T12:00:00.000Z");

  const subscriptionIndexer = testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("actorRepository", ActorRepository)
    .provideClass("inviteCodeRepository", InviteCodeRepository)
    .provideValue("backfillScheduler", mockBackfillScheduler)
    .provideClass("subscriptionIndexingPolicy", SubscriptionIndexingPolicy)
    .injectClass(SubscriptionIndexer);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fakeDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("upsert", () => {
    test("サブスクリプションレコードをupsertする場合、subscriptionsテーブルに保存する", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "me.subsco.sync.subscription",
      )
        .vars({ actor: () => actor })
        .props({
          json: () => ({
            $type: "me.subsco.sync.subscription",
            appviewDid: env.APPVIEW_DID,
            createdAt: fakeDate.toISOString(),
          }),
        })
        .create();
      const record = Record.fromJson({
        uri: subscriptionRecord.uri,
        cid: subscriptionRecord.cid,
        json: subscriptionRecord.json,
        indexedAt: fakeDate,
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

    test("actorのbackfillStatusがdirtyの場合、backfillSchedulerでスケジュールする", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .props({ backfillStatus: () => "dirty" })
        .create();
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "me.subsco.sync.subscription",
      )
        .vars({ actor: () => actor })
        .props({
          json: () => ({
            $type: "me.subsco.sync.subscription",
            appviewDid: env.APPVIEW_DID,
            createdAt: fakeDate.toISOString(),
          }),
        })
        .create();
      const record = Record.fromJson({
        uri: subscriptionRecord.uri,
        cid: subscriptionRecord.cid,
        json: subscriptionRecord.json,
        indexedAt: fakeDate,
      });

      // act
      await subscriptionIndexer.upsert({ ctx, record });

      // assert
      expect(mockBackfillScheduler.schedule).toHaveBeenCalledTimes(1);
      expect(mockBackfillScheduler.schedule).toHaveBeenCalledWith(actor.did);
    });

    test("actorのbackfillStatusがsynchronizedの場合、backfillSchedulerは呼ばれない", async () => {
      // arrange
      const actor = await actorFactory(ctx.db)
        .props({ backfillStatus: () => "synchronized" })
        .create();
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "me.subsco.sync.subscription",
      )
        .vars({ actor: () => actor })
        .props({
          json: () => ({
            $type: "me.subsco.sync.subscription",
            appviewDid: env.APPVIEW_DID,
            createdAt: fakeDate.toISOString(),
          }),
        })
        .create();
      const record = Record.fromJson({
        uri: subscriptionRecord.uri,
        cid: subscriptionRecord.cid,
        json: subscriptionRecord.json,
        indexedAt: fakeDate,
      });

      // act
      await subscriptionIndexer.upsert({ ctx, record });

      // assert
      expect(mockBackfillScheduler.schedule).not.toHaveBeenCalled();
    });
  });

  describe("shouldIndex", () => {
    test("appviewDidが一致し有効な招待コードがある場合、trueを返す", async () => {
      // arrange
      const inviteCode = await inviteCodeFactory(ctx.db)
        .props({
          expiresAt: () => new Date("2024-01-02T12:00:00.000Z"), // 1日後
        })
        .create();
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "me.subsco.sync.subscription",
      )
        .props({
          json: () => ({
            $type: "me.subsco.sync.subscription",
            appviewDid: env.APPVIEW_DID,
            inviteCode: inviteCode.code,
            createdAt: fakeDate.toISOString(),
          }),
        })
        .create();
      const record = Record.fromJson({
        uri: subscriptionRecord.uri,
        cid: subscriptionRecord.cid,
        json: subscriptionRecord.json,
        indexedAt: fakeDate,
      });

      // act
      const result = await subscriptionIndexer.shouldIndex({ ctx, record });

      // assert
      expect(result).toBe(true);
    });

    test("appviewDidが一致しないか招待コードがない場合、falseを返す", async () => {
      // arrange
      const subscriptionRecord = await recordFactory(
        ctx.db,
        "me.subsco.sync.subscription",
      )
        .props({
          json: () => ({
            $type: "me.subsco.sync.subscription",
            appviewDid: "did:web:other.appview.test",
            createdAt: fakeDate.toISOString(),
          }),
        })
        .create();
      const record = Record.fromJson({
        uri: subscriptionRecord.uri,
        cid: subscriptionRecord.cid,
        json: subscriptionRecord.json,
        indexedAt: fakeDate,
      });

      // act
      const result = await subscriptionIndexer.shouldIndex({ ctx, record });

      // assert
      expect(result).toBe(false);
    });
  });
});
