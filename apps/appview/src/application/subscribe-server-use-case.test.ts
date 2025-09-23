import { asDid } from "@atproto/did";
import {
  actorFactory,
  getTestSetup,
  inviteCodeFactory,
  subscriptionFactory,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { InviteCodeRepository } from "../infrastructure/invite-code-repository.js";
import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import {
  AlreadySubscribedError,
  InvalidInviteCodeError,
  SubscribeServerUseCase,
} from "./subscribe-server-use-case.js";

describe("SubscribeServerUseCase", () => {
  const { testInjector, ctx } = getTestSetup();

  const subscribeServerUseCase = testInjector
    .provideClass("inviteCodeRepository", InviteCodeRepository)
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .injectClass(SubscribeServerUseCase);

  test("有効な招待コードの場合、サブスクリプションを作成する", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const inviteCode = await inviteCodeFactory(ctx.db)
      .props({
        expiresAt: () => new Date("2030-01-01"),
      })
      .create();

    // act
    await subscribeServerUseCase.execute({
      inviteCode: inviteCode.code,
      actorDid: asDid(actor.did),
    });

    // assert
    const savedSubscription = await ctx.db.query.subscriptions.findFirst({
      where: (subscriptions, { eq }) => eq(subscriptions.actorDid, actor.did),
    });
    expect(savedSubscription).toMatchObject({
      actorDid: actor.did,
      inviteCode: inviteCode.code,
    });
  });

  test("招待コードが提供されない場合、InvalidInviteCodeErrorをthrowする", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();

    // act & assert
    await expect(
      subscribeServerUseCase.execute({
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(new InvalidInviteCodeError("Invite code is required"));
  });

  test("すでにサブスクライブ済みの場合、AlreadySubscribedErrorをthrowする", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    await subscriptionFactory(ctx.db)
      .vars({
        actor: () => actor,
        inviteCode: () => inviteCode,
      })
      .create();

    // act & assert
    await expect(
      subscribeServerUseCase.execute({
        inviteCode: "test-code",
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(
      new AlreadySubscribedError("Already subscribed to this server"),
    );
  });

  test("招待コードが存在しない場合、InvalidInviteCodeErrorをthrowする", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();

    // act & assert
    await expect(
      subscribeServerUseCase.execute({
        inviteCode: "invalid-code",
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(new InvalidInviteCodeError("Invalid invite code"));
  });

  test("招待コードが期限切れの場合、InvalidInviteCodeErrorをthrowする", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const expiredInviteCode = await inviteCodeFactory(ctx.db)
      .props({
        expiresAt: () => new Date("2020-01-01"),
      })
      .create();

    // act & assert
    await expect(
      subscribeServerUseCase.execute({
        inviteCode: expiredInviteCode.code,
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(new InvalidInviteCodeError("Invite code has expired"));
  });

  test("招待コードがすでに使用されている場合、InvalidInviteCodeErrorをthrowする", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();
    const inviteCode = await inviteCodeFactory(ctx.db)
      .props({
        expiresAt: () => new Date("2030-01-01"),
      })
      .create();
    const otherActor = await actorFactory(ctx.db).create();
    await subscriptionFactory(ctx.db)
      .vars({
        actor: () => otherActor,
        inviteCode: () => inviteCode,
      })
      .create();

    // act & assert
    await expect(
      subscribeServerUseCase.execute({
        inviteCode: inviteCode.code,
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(
      new InvalidInviteCodeError("Invite code has already been used"),
    );
  });
});
