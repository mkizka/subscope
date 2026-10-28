import { asDid } from "@atproto/did";
import { subscriptionFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("UpdateSeenUseCase", () => {
  let updateSeenUseCase: TestServices["updateSeenUseCase"];
  let subscriptionRepo: TestServices["subscriptionRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    updateSeenUseCase = services.updateSeenUseCase;
    subscriptionRepo = services.subscriptionRepository;
  });

  test("サブスクリプションの既読時刻を更新する", async () => {
    // arrange
    const subscription = subscriptionFactory();
    subscriptionRepo.add(subscription);
    const seenAt = new Date("2025-01-01T00:00:00.000Z");

    // act
    await updateSeenUseCase.execute({
      actorDid: asDid(subscription.actorDid),
      seenAt,
    });

    // assert
    const result = await subscriptionRepo.findFirst(subscription.actorDid);
    expect(result?.seenAt).toEqual(seenAt);
  });
});
