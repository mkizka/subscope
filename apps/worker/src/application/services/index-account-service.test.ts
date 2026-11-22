import { asDid } from "@atproto/did";
import { asHandle } from "@repo/common/utils";
import { beforeEach, describe, expect, test } from "vitest";

import { accountFactory } from "../../domain/account.factory.js";
import {
  afterCommit,
  testRegistry,
  type TestServices,
} from "../../shared/test-utils.js";

describe("IndexAccountService", () => {
  let indexAccountService: TestServices["indexAccountService"];
  let accountRepo: TestServices["accountRepository"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    indexAccountService = services.indexAccountService;
    accountRepo = services.accountRepository;
    db = services.db;
  });

  describe("upsert", () => {
    test("handle指定あり、既存accountなしの場合は、accountを作成する", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const testDid = asDid("did:plc:new-with-handle");
      const testHandle = asHandle("new-with-handle.bsky.social");

      // act
      await indexAccountService.upsert({
        ctx,
        did: testDid,
        handle: testHandle,
      });

      // assert
      const account = await accountRepo.find({ ctx, did: testDid });
      expect(account).toMatchObject({
        did: testDid,
        handle: testHandle,
      });
    });

    test("handle指定あり、既存accountあり、既存accountのhandleなしの場合は、handleを更新する", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const existingDid = asDid("did:plc:no-handle-to-handle");
      const newHandle = asHandle("new-handle.bsky.social");
      const existingAccount = accountFactory({
        did: existingDid,
        handle: null,
      });
      accountRepo.add(existingAccount);

      // act
      await indexAccountService.upsert({
        ctx,
        did: existingDid,
        handle: newHandle,
      });

      // assert
      const account = await accountRepo.find({ ctx, did: existingDid });
      expect(account).toMatchObject({
        handle: newHandle,
      });
    });

    test("handle指定あり、既存accountあり、既存accountのhandleありで同じ値の場合は、何もしない", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const existingDid = asDid("did:plc:same-handle");
      const existingHandle = asHandle("same-handle.bsky.social");
      const existingAccount = accountFactory({
        did: existingDid,
        handle: existingHandle,
      });
      accountRepo.add(existingAccount);

      // act
      await indexAccountService.upsert({
        ctx,
        did: existingDid,
        handle: existingHandle,
      });

      // assert
      const account = await accountRepo.find({ ctx, did: existingDid });
      expect(account).toMatchObject({
        handle: existingHandle,
      });
    });

    test("handle指定あり、既存accountあり、既存accountのhandleありで異なる値の場合は、handleを更新する", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const existingDid = asDid("did:plc:changed-handle");
      const oldHandle = asHandle("old-handle.bsky.social");
      const newHandle = asHandle("new-handle.bsky.social");
      const existingAccount = accountFactory({
        did: existingDid,
        handle: oldHandle,
      });
      accountRepo.add(existingAccount);

      // act
      await indexAccountService.upsert({
        ctx,
        did: existingDid,
        handle: newHandle,
      });

      // assert
      const account = await accountRepo.find({ ctx, did: existingDid });
      expect(account).toMatchObject({
        handle: newHandle,
      });
    });

    test("handle指定なし、既存accountなしの場合は、accountを作成する", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const newDid = asDid("did:plc:new-no-handle");

      // act
      await indexAccountService.upsert({
        ctx,
        did: newDid,
      });

      // assert
      const account = await accountRepo.find({ ctx, did: newDid });
      expect(account).toMatchObject({
        did: newDid,
        handle: null,
      });
    });

    test("handle指定なし、既存accountあり、既存accountのhandleなしの場合は、何もしない", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const existingDidNoHandle = asDid("did:plc:existing-no-handle");
      const existingAccount = accountFactory({
        did: existingDidNoHandle,
        handle: null,
      });
      accountRepo.add(existingAccount);

      // act
      await indexAccountService.upsert({
        ctx,
        did: existingDidNoHandle,
      });

      // assert
      const account = await accountRepo.find({
        ctx,
        did: existingDidNoHandle,
      });
      expect(account).toMatchObject({
        handle: null,
      });
    });

    test("handle指定なし、既存accountあり、既存accountのhandleありの場合は、何もしない", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const existingDid = asDid("did:plc:existing-with-handle");
      const existingHandle = asHandle("existing-with-handle.bsky.social");
      const existingAccount = accountFactory({
        did: existingDid,
        handle: existingHandle,
      });
      accountRepo.add(existingAccount);

      // act
      await indexAccountService.upsert({
        ctx,
        did: existingDid,
      });

      // assert
      const account = await accountRepo.find({ ctx, did: existingDid });
      expect(account).toMatchObject({
        handle: existingHandle,
      });
    });
  });
});
