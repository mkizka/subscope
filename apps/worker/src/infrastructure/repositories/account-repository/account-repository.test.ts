import { asDid } from "@atproto/did";
import { Account } from "@repo/common/domain";
import { schema } from "@repo/db";
import { accountFactory, testSetup } from "@repo/test-utils";
import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { AccountRepository } from "./account-repository.js";

describe("AccountRepository", () => {
  const { ctx } = testSetup;
  const accountRepository = new AccountRepository();

  describe("find", () => {
    test("アカウントが存在しない場合、nullを返す", async () => {
      // arrange
      const did = asDid("did:plc:xxx");

      // act
      const result = await accountRepository.find({ ctx, did });

      // assert
      expect(result).toBeNull();
    });

    test("アカウントが存在する場合、アカウントを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();

      // act
      const result = await accountRepository.find({
        ctx,
        did: asDid(account.did),
      });

      // assert
      const expected = Account.reconstruct({
        did: account.did,
        handle: account.handle,
        isAdmin: account.isAdmin,
        isBanned: account.isBanned,
        indexedAt: account.indexedAt,
      });
      expect(result).toEqual(expected);
    });
  });

  describe("save", () => {
    test("新規アカウントの場合、アカウントを挿入する", async () => {
      // arrange
      const did = asDid("did:plc:newactor123");
      const newAccount = Account.reconstruct({
        did: did,
        handle: "newactor.test",
        isAdmin: false,
        isBanned: false,
        indexedAt: new Date(),
      });

      // act
      await accountRepository.save({ ctx, account: newAccount });

      // assert
      const result = await accountRepository.find({ ctx, did });
      expect(result).toEqual(newAccount);
    });

    test("既存アカウントの場合、アカウントを更新する", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();

      const updatedAccount = Account.reconstruct({
        did: account.did,
        handle: "updated.test",
        isAdmin: false,
        isBanned: false,
        indexedAt: account.indexedAt,
      });

      // act
      await accountRepository.save({ ctx, account: updatedAccount });

      // assert
      const result = await accountRepository.find({
        ctx,
        did: asDid(account.did),
      });
      expect(result).toEqual(updatedAccount);
    });
  });

  test("index-13: アカウントを保存するときは、管理者権限を書き換えない", async () => {
    // arrange
    const account = await accountFactory(ctx.db).create();
    const staleAccount = Account.reconstruct({
      did: account.did,
      handle: "updated.test",
      isAdmin: false,
      isBanned: false,
      indexedAt: account.indexedAt,
    });
    await ctx.db
      .update(schema.accounts)
      .set({ isAdmin: true })
      .where(eq(schema.accounts.did, account.did));

    // act
    await accountRepository.save({ ctx, account: staleAccount });

    // assert
    const result = await accountRepository.find({
      ctx,
      did: asDid(account.did),
    });
    expect(result?.isAdmin).toBe(true);
  });

  describe("delete", () => {
    test("アカウントを削除する", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();

      // act
      await accountRepository.delete({ ctx, did: asDid(account.did) });

      // assert
      const result = await accountRepository.find({
        ctx,
        did: asDid(account.did),
      });
      expect(result).toBeNull();
    });
  });
});
