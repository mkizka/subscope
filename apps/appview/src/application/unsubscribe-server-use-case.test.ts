import { asDid } from "@atproto/did";
import {
  actorFactory,
  inviteCodeFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { SubscriptionRepository } from "../infrastructure/subscription-repository/subscription-repository.js";
import {
  NotSubscribedError,
  UnsubscribeServerUseCase,
} from "./unsubscribe-server-use-case.js";

const { testInjector, ctx } = testSetup;

const unsubscribeServerUseCase = testInjector
  .provideClass("subscriptionRepository", SubscriptionRepository)
  .injectClass(UnsubscribeServerUseCase);

describe("UnsubscribeServerUseCase", () => {
  test("サブスクリプションが存在する場合、削除するが招待コードは使用済みのまま", async () => {
    // arrange
    const inviteCode = await inviteCodeFactory(ctx.db)
      .props({
        usedAt: () => new Date("2025-01-01"),
      })
      .create();
    const subscription = await subscriptionFactory(ctx.db)
      .vars({
        inviteCode: () => inviteCode,
      })
      .create();

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
    const updatedInviteCode = await ctx.db.query.inviteCodes.findFirst({
      where: (inviteCodes, { eq }) => eq(inviteCodes.code, inviteCode.code),
    });
    expect(updatedInviteCode?.usedAt).not.toBeNull();
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
