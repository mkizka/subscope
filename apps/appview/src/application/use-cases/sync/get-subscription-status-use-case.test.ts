import { asDid } from "@atproto/did";
import { actorFactory, subscriptionFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetSubscriptionStatusUseCase", () => {
  let services: TestServices;
  beforeEach(async () => {
    services = await testRegistry.resolve();
  });

  test("サブスクリプションが存在しない場合、notSubscribedを返す", async () => {
    const { getSubscriptionStatusUseCase, actorRepository } = services;
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);

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

  test("サブスクリプションが存在する場合、subscribedを返す", async () => {
    const {
      getSubscriptionStatusUseCase,
      subscriptionRepository,
      actorRepository,
    } = services;
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);
    const subscription = subscriptionFactory({ actorDid: actor.did });
    subscriptionRepository.add(subscription);

    // act
    const result = await getSubscriptionStatusUseCase.execute({
      actorDid: asDid(actor.did),
    });

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getSubscriptionStatus#subscribed",
      isSubscriber: true,
    });
  });
});
