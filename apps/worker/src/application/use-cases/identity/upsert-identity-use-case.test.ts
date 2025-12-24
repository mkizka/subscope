import { actorFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";
import { UpsertIdentityUseCase } from "./upsert-identity-use-case.js";

describe("UpsertIdentityUseCase", () => {
  const upsertIdentityUseCase = testInjector.injectClass(UpsertIdentityUseCase);

  const actorRepo = testInjector.resolve("actorRepository");

  const ctx = {
    db: testInjector.resolve("db"),
  };

  test("ハンドルがない場合は何もしない", async () => {
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:nohandle",
      handle: undefined,
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const foundActor = await actorRepo.findByDid({ ctx, did: command.did });
    expect(foundActor).toBeNull();
  });

  test("ハンドルがある場合はactorを保存する", async () => {
    // arrange
    const actor = actorFactory({
      handle: "old-handle.bsky.social",
    });
    actorRepo.add(actor);

    const command: UpsertIdentityCommand = {
      did: actor.did,
      handle: "new-handle.bsky.social",
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const foundActor = await actorRepo.findByDid({ ctx, did: command.did });
    expect(foundActor).not.toBeNull();
    expect(foundActor?.handle).toBe(command.handle);
  });
});
