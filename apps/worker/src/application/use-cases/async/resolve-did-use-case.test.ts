import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import { accountFactory } from "@repo/common/test";
import { asHandle } from "@repo/common/utils";
import { beforeEach, describe, expect, test } from "vitest";

import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

describe("ResolveDidUseCase", () => {
  let resolveDidUseCase: TestServices["resolveDidUseCase"];
  let accountRepository: TestServices["accountRepository"];
  let didResolver: TestServices["didResolver"];
  let handleResolver: TestServices["handleResolver"];
  let ctx: { db: TestServices["db"] };
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    resolveDidUseCase = services.resolveDidUseCase;
    accountRepository = services.accountRepository;
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
    const account = await accountRepository.find({ ctx, did });
    expect(account?.handle).toBe("alice.test");
  });

  test("resolveDid-2: ハンドルが同じDIDに解決できないときは handle.invalid を保存する", async () => {
    // arrange
    const did = asDid("did:plc:impostor");
    setDidDocument(did, "alice.test");
    handleResolver.add(asHandle("alice.test"), asDid("did:plc:alice"));

    // act
    await resolveDidUseCase.execute(did);

    // assert
    const account = await accountRepository.find({ ctx, did });
    expect(account?.handle).toBe("handle.invalid");
  });

  test("resolveDid-3: すでに handle.invalid 以外のハンドルを持つアカウントのハンドルは上書きしない", async () => {
    // arrange
    const account = accountFactory({ handle: asHandle("old.test") });
    accountRepository.add(account);
    setDidDocument(account.did, "alice.test");
    handleResolver.add(asHandle("alice.test"), account.did);

    // act
    await resolveDidUseCase.execute(account.did);

    // assert
    const saved = await accountRepository.find({ ctx, did: account.did });
    expect(saved?.handle).toBe("old.test");
  });
});
