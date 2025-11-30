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
  const { testInjector, ctx } = testSetup;

  const subscriptionRepository =
    testInjector.injectClass(SubscriptionRepository);

  describe("findMany", () => {
    test("サブスクリプションが存在しない場合、空の配列を返す", async () => {
      // act
      const result = await subscriptionRepository.findMany({ limit: 10 });

      // assert
      expect(result).toEqual([]);
    });

    test("サブスクリプションが存在する場合、createdAtの降順で返す", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db).create();
      const subscription1 = await subscriptionFactory(ctx.db)
        .vars({ actor: () => actor1 })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const actor2 = await actorFactory(ctx.db).create();
      const subscription2 = await subscriptionFactory(ctx.db)
        .vars({ actor: () => actor2 })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await subscriptionRepository.findMany({ limit: 10 });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.actorDid).toBe(subscription2.actorDid);
      expect(result[1]?.actorDid).toBe(subscription1.actorDid);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const actors = await actorFactory(ctx.db).createList(3);
      await Promise.all(
        actors.map((actor) =>
          subscriptionFactory(ctx.db)
            .vars({ actor: () => actor })
            .create(),
        ),
      );

      // act
      const result = await subscriptionRepository.findMany({ limit: 2 });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前のサブスクリプションを返す", async () => {
      // arrange
      const actor1 = await actorFactory(ctx.db).create();
      const subscription1 = await subscriptionFactory(ctx.db)
        .vars({ actor: () => actor1 })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const actor2 = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => actor2 })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = "2024-01-01T01:30:00.000Z";

      // act
      const result = await subscriptionRepository.findMany({
        limit: 10,
        cursor: cursorDate,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.actorDid).toBe(subscription1.actorDid);
    });
  });

  describe("findFirst", () => {
    test("サブスクリプションが存在しない場合、nullを返す", async () => {
      // arrange
      const nonExistentDid = asDid("did:plc:notfound123");

      // act
      const result = await subscriptionRepository.findFirst(nonExistentDid);

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
      const result = await subscriptionRepository.findFirst(
        asDid(subscription.actorDid),
      );

      // assert
      expect(result).toMatchObject({
        actorDid: subscription.actorDid,
        inviteCode: subscription.inviteCode,
      });
    });
  });

  describe("existsByInviteCode", () => {
    test("招待コードが使用されていない場合、falseを返す", async () => {
      // arrange
      const nonExistentCode = "nonexistent-code";

      // act
      const result =
        await subscriptionRepository.existsByInviteCode(nonExistentCode);

      // assert
      expect(result).toBe(false);
    });

    test("招待コードが使用されている場合、trueを返す", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const inviteCode = await inviteCodeFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({
          actor: () => actor,
          inviteCode: () => inviteCode,
        })
        .create();

      // act
      const result = await subscriptionRepository.existsByInviteCode(
        inviteCode.code,
      );

      // assert
      expect(result).toBe(true);
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
      const saved = await subscriptionRepository.findFirst(
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
      const deleted = await subscriptionRepository.findFirst(
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
