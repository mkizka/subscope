import { asDid } from "@atproto/did";
import {
  actorFactory,
  inviteCodeFactory,
  subscriptionFactory,
} from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../test-utils.js";
import {
  NotSubscribedError,
  UnsubscribeServerUseCase,
} from "./unsubscribe-server-use-case.js";

describe("UnsubscribeServerUseCase", () => {
  const unsubscribeServerUseCase = testInjector.injectClass(
    UnsubscribeServerUseCase,
  );
  const subscriptionRepo = testInjector.resolve("subscriptionRepository");
  const inviteCodeRepo = testInjector.resolve("inviteCodeRepository");
  const actorRepo = testInjector.resolve("actorRepository");

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
    await unsubscribeServerUseCase.execute({
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
      unsubscribeServerUseCase.execute({
        actorDid: asDid(actor.did),
      }),
    ).rejects.toThrow(new NotSubscribedError("Not subscribed to this server"));
  });
});
