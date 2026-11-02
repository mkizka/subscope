import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import { actorFactory } from "@repo/common/test";
import { asHandle } from "@repo/common/utils";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("ResolveDidUseCase", () => {
  let resolveDidUseCase: TestServices["resolveDidUseCase"];
  let actorRepository: TestServices["actorRepository"];
  let didResolver: TestServices["didResolver"];
  let handleResolver: TestServices["handleResolver"];
  let ctx: { db: TestServices["db"] };
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    resolveDidUseCase = services.resolveDidUseCase;
    actorRepository = services.actorRepository;
    didResolver = services.didResolver;
    handleResolver = services.handleResolver;
    ctx = { db: services.db };
  });

  const setDidDocument = (did: Did, handle: string) => {
    didResolver.setResolveResult(did, {
      handle: asHandle(handle),
      signingKey: "test-key",
      pds: new URL("https://example.com"),
    });
  };

  test("resolveDid-1: DIDドキュメントのハンドルは、そのハンドルが同じDIDに解決できるときだけ保存する", async () => {
    // arrange
    const did = asDid("did:plc:alice");
    setDidDocument(did, "alice.test");
    handleResolver.add(asHandle("alice.test"), did);

    // act
    await resolveDidUseCase.execute(did);

    // assert
    const actor = await actorRepository.find({ ctx, did });
    expect(actor?.handle).toBe("alice.test");
  });

  test("resolveDid-2: ハンドルが同じDIDに解決できないときは handle.invalid を保存する", async () => {
    // arrange
    const did = asDid("did:plc:impostor");
    setDidDocument(did, "alice.test");
    handleResolver.add(asHandle("alice.test"), asDid("did:plc:alice"));

    // act
    await resolveDidUseCase.execute(did);

    // assert
    const actor = await actorRepository.find({ ctx, did });
    expect(actor?.handle).toBe("handle.invalid");
  });

  test("resolveDid-3: すでに handle.invalid 以外のハンドルを持つアクターのハンドルは上書きしない", async () => {
    // arrange
    const actor = actorFactory({ handle: asHandle("old.test") });
    actorRepository.add(actor);
    setDidDocument(actor.did, "alice.test");
    handleResolver.add(asHandle("alice.test"), actor.did);

    // act
    await resolveDidUseCase.execute(actor.did);

    // assert
    const saved = await actorRepository.find({ ctx, did: actor.did });
    expect(saved?.handle).toBe("old.test");
  });
});
