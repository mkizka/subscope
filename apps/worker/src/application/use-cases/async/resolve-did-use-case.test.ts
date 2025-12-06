import { asDid } from "@atproto/did";
import { actorFactory } from "@repo/common/test";
import { asHandle } from "@repo/common/utils";
import { describe, expect, test } from "vitest";

import { testInjector } from "../../../shared/test-utils.js";
import { ResolveDidUseCase } from "./resolve-did-use-case.js";

describe("ResolveDidUseCase", () => {
  const actorRepository = testInjector.resolve("actorRepository");
  const didResolver = testInjector.resolve("didResolver");
  const ctx = {
    db: testInjector.resolve("db"),
  };

  const resolveDidUseCase = testInjector.injectClass(ResolveDidUseCase);

  test("既存のactorが存在しない場合、新規actorを作成する", async () => {
    // arrange
    const did = asDid("did:plc:new-actor");
    const handle = asHandle("newactor.test");
    didResolver.setResolveResult(did, {
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
    const oldHandle = asHandle("oldhandle.test");
    const newHandle = asHandle("newhandle.test");
    const actor = actorFactory({ handle: oldHandle });
    actorRepository.add(actor);

    didResolver.setResolveResult(actor.did, {
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
