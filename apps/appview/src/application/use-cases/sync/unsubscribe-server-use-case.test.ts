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
  let sut: TestServices["unsubscribeServerUseCase"];
  let subscriptionRepo: TestServices["subscriptionRepository"];
  let inviteCodeRepo: TestServices["inviteCodeRepository"];
  let actorRepo: TestServices["actorRepository"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.unsubscribeServerUseCase;
    subscriptionRepo = services.subscriptionRepository;
    inviteCodeRepo = services.inviteCodeRepository;
    actorRepo = services.actorRepository;
  });

  test("サブスクリプションが存在する場合、削除するが招待コードは使用済みのまま", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);
    const inviteCode = inviteCodeFactory({
      usedAt: new Date("2025-01-01"),
    });
    inviteCodeRepo.add(inviteCode);
    const subscription = subscriptionFactory({
      actorDid: actor.did,
      inviteCode: inviteCode.code,
    });
    subscriptionRepo.add(subscription);

    // act
    await sut.execute({
      actorDid: asDid(actor.did),
    });

    // assert
    const result = await subscriptionRepo.findFirst(asDid(actor.did));
    expect(result).toBeNull();
    const updatedInviteCode = await inviteCodeRepo.findFirst(inviteCode.code);
    expect(updatedInviteCode?.usedAt).not.toBeNull();
  });

  test("サブスクリプションが存在しない場合、NotSubscribedErrorをthrowする", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);

    // act & assert
    await expect(
      sut.execute({
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(new NotSubscribedError("Not subscribed to this server"));
  });
});
