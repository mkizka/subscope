import { asDid } from "@atproto/did";
import { actorFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import type { HandleAccountCommand } from "./handle-account-command.js";
import { HandleAccountUseCase } from "./handle-account-use-case.js";

describe("HandleAccountUseCase", () => {
  const handleAccountUseCase = testInjector.injectClass(HandleAccountUseCase);

  const actorRepo = testInjector.resolve("actorRepository");
  const transactionManager = testInjector.resolve("transactionManager");

  test("ステータスがdeletedの場合、actorがデータベースから削除される", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);
    const command: HandleAccountCommand = {
      did: asDid(actor.did),
      status: "deleted",
      active: false,
      indexedAt: new Date("2024-01-01T00:00:00.000Z"),
    };

    // act
    await handleAccountUseCase.execute(command);

    // assert
    await transactionManager.transaction(async (ctx) => {
      const foundActor = await actorRepo.findByDid({ ctx, did: actor.did });
      expect(foundActor).toBeNull();
    });
  });

  test("ステータスがdeleted以外の場合、何も処理しない", async () => {
    // arrange
    const actor = actorFactory();
    actorRepo.add(actor);
    const command: HandleAccountCommand = {
      did: asDid(actor.did),
      status: "deactivated",
      active: false,
      indexedAt: new Date("2024-01-01T00:00:00.000Z"),
    };

    // act
    await handleAccountUseCase.execute(command);

    // assert
    await transactionManager.transaction(async (ctx) => {
      const foundActor = await actorRepo.findByDid({ ctx, did: actor.did });
      expect(foundActor).toMatchObject({
        did: actor.did,
        handle: actor.handle,
      });
    });
  });
});
