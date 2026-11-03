import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
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
  let jobScheduler: TestServices["jobScheduler"];
  let db: TestServices["db"];
  beforeEach(async () => {
    const services = await testRegistry.resolve();
    indexAccountService = services.indexAccountService;
    accountRepo = services.accountRepository;
    jobScheduler = services.jobScheduler;
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
        live: false,
      });

      // assert
      const account = await accountRepo.find({ ctx, did: testDid });
      expect(account).toMatchObject({
        did: testDid,
        handle: testHandle,
      });

      const profileUri = AtUri.make(testDid, "app.bsky.actor.profile", "self");
      expect(jobScheduler.getFetchRecordJobs()).toContainEqual(
        expect.objectContaining({
          uri: profileUri,
          depth: 0,
          live: false,
        }),
      );
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
        live: false,
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
        live: false,
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
        live: false,
      });

      // assert
      const account = await accountRepo.find({ ctx, did: existingDid });
      expect(account).toMatchObject({
        handle: newHandle,
      });
    });

    test("handle指定なし、既存accountなしの場合は、accountを作成してresolvDidジョブを追加する", async () => {
      const ctx = { db, afterCommit };
      // arrange
      const newDid = asDid("did:plc:new-no-handle");

      // act
      await indexAccountService.upsert({
        ctx,
        did: newDid,
        live: false,
      });

      // assert
      const account = await accountRepo.find({ ctx, did: newDid });
      expect(account).toMatchObject({
        did: newDid,
        handle: null,
      });

      expect(jobScheduler.getResolveDidJobs()).toContainEqual(
        expect.objectContaining({
          did: newDid,
        }),
      );
    });

    test("handle指定なし、既存accountあり、既存accountのhandleなしの場合は、resolvDidジョブを追加する", async () => {
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
        live: false,
      });

      // assert
      const account = await accountRepo.find({
        ctx,
        did: existingDidNoHandle,
      });
      expect(account).toMatchObject({
        handle: null,
      });

      expect(jobScheduler.getResolveDidJobs()).toContainEqual(
        expect.objectContaining({
          did: existingDidNoHandle,
        }),
      );
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
        live: false,
      });

      // assert
      const account = await accountRepo.find({ ctx, did: existingDid });
      expect(account).toMatchObject({
        handle: existingHandle,
      });
    });
  });
});
