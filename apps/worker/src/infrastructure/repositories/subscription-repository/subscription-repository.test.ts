import { actorFactory, subscriptionFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { SubscriptionRepository } from "./subscription-repository.js";

describe("SubscriptionRepository", () => {
  const { ctx } = testSetup;

  const subscriptionRepository = new SubscriptionRepository();

  describe("existsSubscriberIn", () => {
    test("指定したactorDidの中にサブスクライバーがいる場合、trueを返す", async () => {
      // arrange
      const subscriber = await actorFactory(ctx.db).create();
      const nonSubscriber = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriber })
        .create();

      // act
      const result = await subscriptionRepository.existsSubscriberIn(ctx, [
        subscriber.did,
        nonSubscriber.did,
      ]);

      // assert
      expect(result).toBe(true);
    });

    test("指定したactorDidにサブスクライバーがいない場合、falseを返す", async () => {
      // arrange
      const nonSubscriber = await actorFactory(ctx.db).create();

      // act
      const result = await subscriptionRepository.existsSubscriberIn(ctx, [
        nonSubscriber.did,
      ]);

      // assert
      expect(result).toBe(false);
    });

    test("空配列の場合、falseを返す", async () => {
      // act
      const result = await subscriptionRepository.existsSubscriberIn(ctx, []);

      // assert
      expect(result).toBe(false);
    });
  });
});
