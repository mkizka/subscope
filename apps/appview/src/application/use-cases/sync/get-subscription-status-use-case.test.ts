import { asDid } from "@atproto/did";
import { actorFactory, subscriptionFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("GetSubscriptionStatusUseCase", () => {
  let sut: TestServices["getSubscriptionStatusUseCase"];
  let actorRepo: TestServices["actorRepository"];
  let subscriptionRepo: TestServices["subscriptionRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.getSubscriptionStatusUseCase;
    actorRepo = services.actorRepository;
    subscriptionRepo = services.subscriptionRepository;
  });

  test("サブスクリプションが存在しない場合、notSubscribedを返す", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);

    // act
    const result = await sut.execute({
      actorDid: asDid(actor.did),
    });

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getSubscriptionStatus#notSubscribed",
      isSubscriber: false,
    });
  });

  test("サブスクリプションが存在する場合、subscribedを返す", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);
    const subscription = subscriptionFactory({ actorDid: actor.did });
    subscriptionRepo.add(subscription);

    // act
    const result = await sut.execute({
      actorDid: asDid(actor.did),
    });

    // assert
    expect(result).toEqual({
      $type: "me.subsco.sync.getSubscriptionStatus#subscribed",
      isSubscriber: true,
    });
  });
});
