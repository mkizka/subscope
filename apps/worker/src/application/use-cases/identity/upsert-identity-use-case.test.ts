import { actorFactory } from "@repo/common/test";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

describe("UpsertIdentityUseCase", () => {
  let upsertIdentityUseCase: TestServices["upsertIdentityUseCase"];
  let actorRepo: TestServices["actorRepository"];
  let db: TestServices["db"];
  let ctx: { db: TestServices["db"] };
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    upsertIdentityUseCase = services.upsertIdentityUseCase;
    actorRepo = services.actorRepository;
    db = services.db;
    ctx = { db };
  });

  test("ハンドルがない場合は何もしない", async () => {
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:nohandle",
      handle: undefined,
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const foundActor = await actorRepo.findByDid({
      ctx,
      did: command.did,
    });
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
    const foundActor = await actorRepo.findByDid({
      ctx,
      did: command.did,
    });
    expect(foundActor).not.toBeNull();
    expect(foundActor?.handle).toBe(command.handle);
  });
});
