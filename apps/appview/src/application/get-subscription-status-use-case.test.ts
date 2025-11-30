import { asDid } from "@atproto/did";
import { actorFactory, subscriptionFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../shared/test-utils.js";
import { GetSubscriptionStatusUseCase } from "./get-subscription-status-use-case.js";

describe("GetSubscriptionStatusUseCase", () => {
  const getSubscriptionStatusUseCase = testInjector.injectClass(
    GetSubscriptionStatusUseCase,
  );
  const subscriptionRepo = testInjector.resolve("subscriptionRepository");
  const actorRepo = testInjector.resolve("actorRepository");

  test("サブスクリプションが存在しない場合、notSubscribedを返す", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);

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
    const actor = actorFactory({ syncRepoStatus: "synchronized" });
    actorRepo.add(actor);
    const subscription = subscriptionFactory({ actorDid: actor.did });
    subscriptionRepo.add(subscription);

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
    const actor = actorFactory({ syncRepoStatus: "dirty" });
    actorRepo.add(actor);
    const subscription = subscriptionFactory({ actorDid: actor.did });
    subscriptionRepo.add(subscription);

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
    const actor = actorFactory({ syncRepoStatus: "in-process" });
    actorRepo.add(actor);
    const subscription = subscriptionFactory({ actorDid: actor.did });
    subscriptionRepo.add(subscription);

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
