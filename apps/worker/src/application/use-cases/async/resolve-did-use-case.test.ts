import { asDid } from "@atproto/did";
import { actorFactory } from "@repo/common/test";
import { asHandle } from "@repo/common/utils";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("ResolveDidUseCase", () => {
  let resolveDidUseCase: TestServices["resolveDidUseCase"];
  let actorRepository: TestServices["actorRepository"];
  let didResolver: TestServices["didResolver"];
  let db: TestServices["db"];
  let ctx: { db: TestServices["db"] };
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    resolveDidUseCase = services.resolveDidUseCase;
    actorRepository = services.actorRepository;
    didResolver = services.didResolver;
    db = services.db;
    ctx = { db };
  });

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
