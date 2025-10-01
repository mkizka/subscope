import { asDid } from "@atproto/did";
import {
  actorFactory,
  getTestSetup,
  subscriptionFactory,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import {
  NotSubscribedError,
  UnsubscribeServerUseCase,
} from "./unsubscribe-server-use-case.js";

const { testInjector, ctx } = getTestSetup();

const unsubscribeServerUseCase = testInjector
  .provideClass("subscriptionRepository", SubscriptionRepository)
  .injectClass(UnsubscribeServerUseCase);

describe("UnsubscribeServerUseCase", () => {
  test("サブスクリプションが存在する場合、削除する", async () => {
    // arrange
    const subscription = await subscriptionFactory(ctx.db).create();

    // act
    await unsubscribeServerUseCase.execute({
      actorDid: asDid(subscription.actorDid),
    });

    // assert
    const result = await ctx.db.query.subscriptions.findFirst({
      where: (subscriptions, { eq }) =>
        eq(subscriptions.actorDid, subscription.actorDid),
    });
    expect(result).toBeUndefined();
  });

  test("サブスクリプションが存在しない場合、NotSubscribedErrorをthrowする", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();

    // act & assert
    await expect(
      unsubscribeServerUseCase.execute({
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(new NotSubscribedError("Not subscribed to this server"));
  });
});
