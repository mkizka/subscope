import { asDid } from "@atproto/did";
import { Subscription } from "@repo/common/domain";
import {
  actorFactory,
  inviteCodeFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { SubscriptionRepository } from "./subscription-repository.js";

describe("SubscriptionRepository", () => {
  const { ctx } = testSetup;

  const subscriptionRepository = new SubscriptionRepository(ctx.db);

  describe("find", () => {
    test("サブスクリプションが存在しない場合、nullを返す", async () => {
      // arrange
      const nonExistentDid = asDid("did:plc:notfound123");

      // act
      const result = await subscriptionRepository.find(nonExistentDid);

      // assert
      expect(result).toBeNull();
    });

    test("サブスクリプションが存在する場合、Subscription情報を返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const subscription = await subscriptionFactory(ctx.db)
        .vars({ actor: () => actor })
        .create();

      // act
      const result = await subscriptionRepository.find(
        asDid(subscription.actorDid),
      );

      // assert
      expect(result).toMatchObject({
        actorDid: subscription.actorDid,
        inviteCode: subscription.inviteCode,
      });
    });
  });

  describe("save", () => {
    test("サブスクリプションを保存できる", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const inviteCode = await inviteCodeFactory(ctx.db).create();
      const subscription = new Subscription({
        actorDid: actor.did,
        inviteCode: inviteCode.code,
        createdAt: new Date(),
      });

      // act
      await ctx.db.transaction(async (tx) => {
        await subscriptionRepository.save({
          subscription,
          ctx: { db: tx },
        });
      });

      // assert
      const saved = await subscriptionRepository.find(
        asDid(subscription.actorDid),
      );
      expect(saved).toMatchObject({
        actorDid: subscription.actorDid,
        inviteCode: subscription.inviteCode,
      });
    });
  });

  describe("delete", () => {
    test("サブスクリプションを削除できる", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const subscription = await subscriptionFactory(ctx.db)
        .vars({ actor: () => actor })
        .create();

      // act
      await subscriptionRepository.delete(asDid(subscription.actorDid));

      // assert
      const deleted = await subscriptionRepository.find(
        asDid(subscription.actorDid),
      );
      expect(deleted).toBeNull();
    });

    test("存在しないサブスクリプションを削除してもエラーにならない", async () => {
      // arrange
      const nonExistentDid = asDid("did:plc:notfound123");

      // act & assert
      await expect(
        subscriptionRepository.delete(nonExistentDid),
      ).resolves.not.toThrow();
    });
  });
});
