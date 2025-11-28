import { asDid } from "@atproto/did";
import {
  actorFactory,
  inviteCodeFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { ActorRepository } from "../infrastructure/actor-repository/actor-repository.js";
import { SubscriptionRepository } from "../infrastructure/subscription-repository.js";
import { GetSubscriptionStatusUseCase } from "./get-subscription-status-use-case.js";

describe("GetSubscriptionStatusUseCase", () => {
  const { testInjector, ctx } = testSetup;

  const getSubscriptionStatusUseCase = testInjector
    .provideClass("subscriptionRepository", SubscriptionRepository)
    .provideClass("actorRepository", ActorRepository)
    .injectClass(GetSubscriptionStatusUseCase);

  test("サブスクリプションが存在しない場合、notSubscribedを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db).create();

    // act
    const result = await getSubscriptionStatusUseCase.execute({
      actorDid: asDid(actor.did),
    });

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getSubscriptionStatus#notSubscribed",
      isSubscriber: false,
    });
  });

  test("サブスクリプションが存在する場合、subscribedとsyncRepoStatusを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .props({
        syncRepoStatus: () => "synchronized",
      })
      .create();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    await subscriptionFactory(ctx.db)
      .vars({
        actor: () => actor,
        inviteCode: () => inviteCode,
      })
      .create();

    // act
    const result = await getSubscriptionStatusUseCase.execute({
      actorDid: asDid(actor.did),
    });

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getSubscriptionStatus#subscribed",
      isSubscriber: true,
      syncRepoStatus: "synchronized",
    });
  });

  test("サブスクリプションが存在し、syncRepoStatusがdirtyの場合、dirtyを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .props({
        syncRepoStatus: () => "dirty",
      })
      .create();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    await subscriptionFactory(ctx.db)
      .vars({
        actor: () => actor,
        inviteCode: () => inviteCode,
      })
      .create();

    // act
    const result = await getSubscriptionStatusUseCase.execute({
      actorDid: asDid(actor.did),
    });

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getSubscriptionStatus#subscribed",
      isSubscriber: true,
      syncRepoStatus: "dirty",
    });
  });

  test("サブスクリプションが存在し、syncRepoStatusがin-processの場合、in-processを返す", async () => {
    // arrange
    const actor = await actorFactory(ctx.db)
      .props({
        syncRepoStatus: () => "in-process",
      })
      .create();
    const inviteCode = await inviteCodeFactory(ctx.db).create();
    await subscriptionFactory(ctx.db)
      .vars({
        actor: () => actor,
        inviteCode: () => inviteCode,
      })
      .create();

    // act
    const result = await getSubscriptionStatusUseCase.execute({
      actorDid: asDid(actor.did),
    });

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getSubscriptionStatus#subscribed",
      isSubscriber: true,
      syncRepoStatus: "in-process",
    });
  });
});
