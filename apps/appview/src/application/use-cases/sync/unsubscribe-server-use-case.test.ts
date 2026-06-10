import { asDid } from "@atproto/did";
import {
  actorFactory,
  inviteCodeFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";
import { NotSubscribedError } from "./unsubscribe-server-use-case.js";

describe("UnsubscribeServerUseCase", () => {
  let services: TestServices;
  beforeEach(async () => {
    services = await testRegistry.resolve();
  });

  test("サブスクリプションが存在する場合、削除するが招待コードは使用済みのまま", async () => {
    const {
      unsubscribeServerUseCase,
      subscriptionRepository,
      inviteCodeRepository,
      actorRepository,
    } = services;
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);
    const inviteCode = inviteCodeFactory({
      usedAt: new Date("2025-01-01"),
    });
    inviteCodeRepository.add(inviteCode);
    const subscription = subscriptionFactory({
      actorDid: actor.did,
      inviteCode: inviteCode.code,
    });
    subscriptionRepository.add(subscription);

    // act
    await unsubscribeServerUseCase.execute({
      actorDid: asDid(actor.did),
    });

    // assert
    const result = await subscriptionRepository.findFirst(asDid(actor.did));
    expect(result).toBeNull();
    const updatedInviteCode = await inviteCodeRepository.findFirst(
      inviteCode.code,
    );
    expect(updatedInviteCode?.usedAt).not.toBeNull();
  });

  test("サブスクリプションが存在しない場合、NotSubscribedErrorをthrowする", async () => {
    const { unsubscribeServerUseCase, actorRepository } = services;
    // arrange
    const actor = actorFactory();
    actorRepository.add(actor);

    // act & assert
    await expect(
      unsubscribeServerUseCase.execute({
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(new NotSubscribedError("Not subscribed to this server"));
  });
});
