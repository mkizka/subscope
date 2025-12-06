import { asDid } from "@atproto/did";
import type { IDidResolver } from "@repo/common/domain";
import { actorFactory } from "@repo/common/test";
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";

import { setupFiles, testInjector } from "../../../shared/test-utils.js";
import { ResolveDidUseCase } from "./resolve-did-use-case.js";

describe("ResolveDidUseCase", () => {
  setupFiles();

  const mockDidResolver = mock<IDidResolver>();
  const actorRepository = testInjector.resolve("actorRepository");
  const ctx = {
    db: testInjector.resolve("db"),
  };

  const resolveDidUseCase = testInjector
    .provideValue("didResolver", mockDidResolver)
    .injectClass(ResolveDidUseCase);

  test("既存のactorが存在しない場合、新規actorを作成する", async () => {
    // arrange
    const did = asDid("did:plc:new-actor");
    const handle = "newactor.test";
    mockDidResolver.resolve.mockResolvedValue({
      handle,
      signingKey: "test-key",
      pds: new URL("https://example.com"),
    });

    // act
    await resolveDidUseCase.execute(did);

    // assert
    const actor = await actorRepository.findByDid({ ctx, did });
    expect(actor).not.toBeNull();
    expect(actor?.did).toBe(did);
    expect(actor?.handle).toBe(handle);
  });

  test("既存のactorが存在する場合、ハンドルを更新する", async () => {
    // arrange
    const oldHandle = "oldhandle.test";
    const newHandle = "newhandle.test";
    const actor = actorFactory({ handle: oldHandle });
    actorRepository.add(actor);

    mockDidResolver.resolve.mockResolvedValue({
      handle: newHandle,
      signingKey: "test-key",
      pds: new URL("https://example.com"),
    });

    // act
    await resolveDidUseCase.execute(actor.did);

    // assert
    const updatedActor = await actorRepository.findByDid({
      ctx,
      did: actor.did,
    });
    expect(updatedActor).not.toBeNull();
    expect(updatedActor?.did).toBe(actor.did);
    expect(updatedActor?.handle).toBe(newHandle);
  });
});
