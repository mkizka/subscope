import { actorFactory, subscriptionFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { SubscriptionRepository } from "./subscription-repository.js";

describe("SubscriptionRepository", () => {
  const { ctx } = testSetup;

  const subscriptionRepository = new SubscriptionRepository();

  describe("isSubscriber", () => {
    test("サブスクライバーの場合、trueを返す", async () => {
      // arrange
      const subscriber = await actorFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({ actor: () => subscriber })
        .create();

      // act
      const result = await subscriptionRepository.isSubscriber(
        ctx,
        subscriber.did,
      );

      // assert
      expect(result).toBe(true);
    });

    test("サブスクライバーでない場合、falseを返す", async () => {
      // arrange
      const nonSubscriber = await actorFactory(ctx.db).create();

      // act
      const result = await subscriptionRepository.isSubscriber(
        ctx,
        nonSubscriber.did,
      );

      // assert
      expect(result).toBe(false);
    });
  });
});
