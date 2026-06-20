import { actorFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

describe("UpsertIdentityUseCase", () => {
  let sut: TestServices["upsertIdentityUseCase"];
  let actorRepository: TestServices["actorRepository"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    sut = services.upsertIdentityUseCase;
    actorRepository = services.actorRepository;
    db = services.db;
  });

  test("ハンドルがない場合は何もしない", async () => {
    const ctx = { db };
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:nohandle",
      handle: undefined,
    };

    // act
    await sut.execute(command);

    // assert
    const foundActor = await actorRepository.findByDid({
      ctx,
      did: command.did,
    });
    expect(foundActor).toBeNull();
  });

  test("ハンドルがある場合はactorを保存する", async () => {
    const ctx = { db };
    // arrange
    const actor = actorFactory({
      handle: "old-handle.bsky.social",
    });
    actorRepository.add(actor);

    const command: UpsertIdentityCommand = {
      did: actor.did,
      handle: "new-handle.bsky.social",
    };

    // act
    await sut.execute(command);

    // assert
    const foundActor = await actorRepository.findByDid({
      ctx,
      did: command.did,
    });
    expect(foundActor).not.toBeNull();
    expect(foundActor?.handle).toBe(command.handle);
  });
});
