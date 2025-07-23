import { Record, Subscription } from "@repo/common/domain";
import { getTestSetup, inviteCodeFactory } from "@repo/test-utils";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { InviteCodeRepository } from "../infrastructure/repositories/invite-code-repository.js";
import { env } from "../shared/env.js";
import { SubscriptionIndexingPolicy } from "./subscription-indexing-policy.js";

describe("SubscriptionIndexingPolicy", () => {
  const { testInjector, ctx } = getTestSetup();
  const fakeDate = new Date("2024-01-01T12:00:00.000Z");

  const subscriptionIndexingPolicy = testInjector
    .provideClass("inviteCodeRepository", InviteCodeRepository)
    .injectClass(SubscriptionIndexingPolicy);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fakeDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("shouldIndex", () => {
    test("appviewDidが環境変数のAPPVIEW_DIDと一致し有効な招待コードがある場合、trueを返す", async () => {
      // arrange
      const inviteCode = await inviteCodeFactory(ctx.db)
        .props({
          expiresAt: () => new Date("2024-01-02T12:00:00.000Z"), // 1日後
        })
        .create();

      const subscriptionJson = {
        $type: "me.subsco.sync.subscription",
        appviewDid: env.APPVIEW_DID,
        inviteCode: inviteCode.code,
        createdAt: fakeDate.toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:user/me.subsco.sync.subscription/123",
        cid: "sub123",
        json: subscriptionJson,
        indexedAt: fakeDate,
      });

      // act
      const result = await subscriptionIndexingPolicy.shouldIndex(
        ctx,
        Subscription.from(record),
      );

      // assert
      expect(result).toBe(true);
    });

    test("appviewDidが環境変数のAPPVIEW_DIDと一致しない場合、falseを返す", async () => {
      // arrange
      const subscriptionJson = {
        $type: "me.subsco.sync.subscription",
        appviewDid: "did:web:other.appview.test",
        createdAt: fakeDate.toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:user/me.subsco.sync.subscription/123",
        cid: "sub123",
        json: subscriptionJson,
        indexedAt: fakeDate,
      });

      // act
      const result = await subscriptionIndexingPolicy.shouldIndex(
        ctx,
        Subscription.from(record),
      );

      // assert
      expect(result).toBe(false);
    });

    test("招待コードが存在しない場合、falseを返す", async () => {
      // arrange
      const subscriptionJson = {
        $type: "me.subsco.sync.subscription",
        appviewDid: env.APPVIEW_DID,
        createdAt: fakeDate.toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:user/me.subsco.sync.subscription/123",
        cid: "sub123",
        json: subscriptionJson,
        indexedAt: fakeDate,
      });

      // act
      const result = await subscriptionIndexingPolicy.shouldIndex(
        ctx,
        Subscription.from(record),
      );

      // assert
      expect(result).toBe(false);
    });

    test("招待コードが無効な場合、falseを返す", async () => {
      // arrange
      const subscriptionJson = {
        $type: "me.subsco.sync.subscription",
        appviewDid: env.APPVIEW_DID,
        inviteCode: "invalid-code",
        createdAt: fakeDate.toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:user/me.subsco.sync.subscription/123",
        cid: "sub123",
        json: subscriptionJson,
        indexedAt: fakeDate,
      });

      // act
      const result = await subscriptionIndexingPolicy.shouldIndex(
        ctx,
        Subscription.from(record),
      );

      // assert
      expect(result).toBe(false);
    });

    test("招待コードが期限切れの場合、falseを返す", async () => {
      // arrange
      const inviteCode = await inviteCodeFactory(ctx.db)
        .props({
          expiresAt: () => new Date("2023-12-31T12:00:00.000Z"), // 1日前
        })
        .create();

      const subscriptionJson = {
        $type: "me.subsco.sync.subscription",
        appviewDid: env.APPVIEW_DID,
        inviteCode: inviteCode.code,
        createdAt: fakeDate.toISOString(),
      };
      const record = Record.fromJson({
        uri: "at://did:plc:user/me.subsco.sync.subscription/123",
        cid: "sub123",
        json: subscriptionJson,
        indexedAt: fakeDate,
      });

      // act
      const result = await subscriptionIndexingPolicy.shouldIndex(
        ctx,
        Subscription.from(record),
      );

      // assert
      expect(result).toBe(false);
    });
  });
});
