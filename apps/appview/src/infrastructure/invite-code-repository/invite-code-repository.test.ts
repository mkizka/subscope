import { InviteCode } from "@repo/common/domain";
import { inviteCodeFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { InviteCodeRepository } from "./invite-code-repository.js";

describe("InviteCodeRepository", () => {
  const { ctx } = testSetup;

  const inviteCodeRepository = new InviteCodeRepository(ctx.db);

  describe("find", () => {
    test("招待コードが存在しない場合、nullを返す", async () => {
      // arrange
      const nonExistentCode = "nonexistent-code";

      // act
      const result = await inviteCodeRepository.find({
        code: nonExistentCode,
        ctx,
      });

      // assert
      expect(result).toBeNull();
    });

    test("招待コードが存在する場合、InviteCode情報を返す", async () => {
      // arrange
      const inviteCode = await inviteCodeFactory(ctx.db).create();

      // act
      const result = await inviteCodeRepository.find({
        code: inviteCode.code,
        ctx,
      });

      // assert
      expect(result).toMatchObject({
        code: inviteCode.code,
        expiresAt: inviteCode.expiresAt,
        createdAt: inviteCode.createdAt,
      });
    });
  });

  describe("save", () => {
    test("新規招待コードを作成できる", async () => {
      // arrange
      const inviteCode = new InviteCode({
        code: "test-code-12345",
        expiresAt: new Date("2025-01-01T00:00:00.000Z"),
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      // act
      await ctx.db.transaction(async (tx) => {
        await inviteCodeRepository.save({
          inviteCode,
          ctx: { db: tx },
        });
      });

      // assert
      const saved = await inviteCodeRepository.find({
        code: inviteCode.code,
        ctx,
      });
      expect(saved).toMatchObject({
        code: inviteCode.code,
        expiresAt: inviteCode.expiresAt,
      });
    });

    test("既存の招待コードを更新できる", async () => {
      // arrange
      const existingInviteCode = await inviteCodeFactory(ctx.db)
        .props({
          usedAt: () => null,
        })
        .create();

      const updatedInviteCode = new InviteCode({
        code: existingInviteCode.code,
        expiresAt: existingInviteCode.expiresAt,
        createdAt: existingInviteCode.createdAt,
        usedAt: new Date("2024-01-01T12:00:00.000Z"),
      });

      // act
      await ctx.db.transaction(async (tx) => {
        await inviteCodeRepository.save({
          inviteCode: updatedInviteCode,
          ctx: { db: tx },
        });
      });

      // assert
      const saved = await inviteCodeRepository.find({
        code: existingInviteCode.code,
        ctx,
      });
      expect(saved).toMatchObject({
        code: existingInviteCode.code,
        usedAt: updatedInviteCode.usedAt,
      });
    });
  });
});
