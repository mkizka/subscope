import { asDid } from "@atproto/did";
import { Registration } from "@repo/common/domain";
import {
  accountFactory,
  inviteCodeFactory,
  registrationFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { RegistrationRepository } from "./registration-repository.js";

describe("RegistrationRepository", () => {
  const { ctx } = testSetup;

  const registrationRepository = new RegistrationRepository(ctx.db);

  describe("find", () => {
    test("登録が存在しない場合、nullを返す", async () => {
      // arrange
      const nonExistentDid = asDid("did:plc:notfound123");

      // act
      const result = await registrationRepository.find(nonExistentDid);

      // assert
      expect(result).toBeNull();
    });

    test("登録が存在する場合、Registrationを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const registration = await registrationFactory(ctx.db)
        .vars({ account: () => account })
        .create();

      // act
      const result = await registrationRepository.find(
        asDid(registration.accountDid),
      );

      // assert
      expect(result).toMatchObject({
        accountDid: registration.accountDid,
        inviteCode: registration.inviteCode,
      });
    });
  });

  describe("save", () => {
    test("登録を保存できる", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const inviteCode = await inviteCodeFactory(ctx.db).create();
      const registration = new Registration({
        accountDid: account.did,
        inviteCode: inviteCode.code,
        createdAt: new Date(),
      });

      // act
      await ctx.db.transaction(async (tx) => {
        await registrationRepository.save({
          registration,
          ctx: { db: tx },
        });
      });

      // assert
      const saved = await registrationRepository.find(
        asDid(registration.accountDid),
      );
      expect(saved).toMatchObject({
        accountDid: registration.accountDid,
        inviteCode: registration.inviteCode,
      });
    });
  });

  describe("delete", () => {
    test("登録を削除できる", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();
      const registration = await registrationFactory(ctx.db)
        .vars({ account: () => account })
        .create();

      // act
      await registrationRepository.delete(asDid(registration.accountDid));

      // assert
      const deleted = await registrationRepository.find(
        asDid(registration.accountDid),
      );
      expect(deleted).toBeNull();
    });

    test("存在しない登録を削除してもエラーにならない", async () => {
      // arrange
      const nonExistentDid = asDid("did:plc:notfound123");

      // act & assert
      await expect(
        registrationRepository.delete(nonExistentDid),
      ).resolves.not.toThrow();
    });
  });
});
