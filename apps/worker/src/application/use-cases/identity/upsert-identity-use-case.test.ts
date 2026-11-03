import { asHandle } from "@repo/common/utils";
import { beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../../domain/account.factory.js";
import { testRegistry, type TestServices } from "../../../shared/test-utils.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

describe("UpsertIdentityUseCase", () => {
  let upsertIdentityUseCase: TestServices["upsertIdentityUseCase"];
  let accountRepo: TestServices["accountRepository"];
  let db: TestServices["db"];
  let didResolver: TestServices["didResolver"];
  let handleResolver: TestServices["handleResolver"];
  let ctx: { db: TestServices["db"] };
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    upsertIdentityUseCase = services.upsertIdentityUseCase;
    accountRepo = services.accountRepository;
    db = services.db;
    didResolver = services.didResolver;
    handleResolver = services.handleResolver;
    ctx = { db };
  });

  test("ハンドルがない場合は何もしない", async () => {
    // arrange
    const command: UpsertIdentityCommand = {
      did: "did:plc:nohandle",
      handle: undefined,
      status: "active",
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const foundAccount = await accountRepo.find({
      ctx,
      did: command.did,
    });
    expect(foundAccount).toBeNull();
  });

  test("ハンドルがある場合はaccountを保存する", async () => {
    // arrange
    const account = accountFactory({
      handle: "old-handle.bsky.social",
    });
    accountRepo.add(account);

    const command: UpsertIdentityCommand = {
      did: account.did,
      handle: "new-handle.bsky.social",
      status: "active",
    };

    // act
    await upsertIdentityUseCase.execute(command);

    // assert
    const foundAccount = await accountRepo.find({
      ctx,
      did: command.did,
    });
    expect(foundAccount).not.toBeNull();
    expect(foundAccount?.handle).toBe(command.handle);
  });

  test("resolveDid-4: Tapのidentityイベントのハンドルが handle.invalid のときは、DIDドキュメントからハンドルを解決し直す", async () => {
    // arrange
    const account = accountFactory();
    didResolver.setResolveResult(account.did, {
      handle: asHandle("alice.test"),
      signingKey: "test-key",
      pds: new URL("https://example.com"),
    });
    handleResolver.add(asHandle("alice.test"), account.did);

    // act
    await upsertIdentityUseCase.execute({
      did: account.did,
      handle: asHandle("handle.invalid"),
      status: "active",
    });

    // assert
    const foundAccount = await accountRepo.find({ ctx, did: account.did });
    expect(foundAccount?.handle).toBe("alice.test");
  });

  test("account-1: アカウントの状態をアカウントに保存する", async () => {
    // arrange
    const account = accountFactory();
    accountRepo.add(account);

    // act
    await upsertIdentityUseCase.execute({
      did: account.did,
      handle: asHandle("alice.test"),
      status: "takendown",
    });

    // assert
    const foundAccount = await accountRepo.find({ ctx, did: account.did });
    expect(foundAccount?.status).toBe("takendown");
  });

  test("account-2: 状態が deleted のアカウントは、アカウントを削除する", async () => {
    // arrange
    const account = accountFactory();
    accountRepo.add(account);

    // act
    await upsertIdentityUseCase.execute({
      did: account.did,
      handle: asHandle("alice.test"),
      status: "deleted",
    });

    // assert
    const foundAccount = await accountRepo.find({ ctx, did: account.did });
    expect(foundAccount).toBeNull();
  });
});
