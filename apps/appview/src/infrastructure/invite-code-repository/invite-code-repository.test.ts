import { InviteCode } from "@repo/common/domain";
import {
  actorFactory,
  inviteCodeFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { InviteCodeRepository } from "./invite-code-repository.js";

describe("InviteCodeRepository", () => {
  const { testInjector, ctx } = testSetup;

  const inviteCodeRepository = testInjector.injectClass(InviteCodeRepository);

  describe("findAll", () => {
    test("招待コードが存在しない場合、空の配列を返す", async () => {
      // act
      const result = await inviteCodeRepository.findAll({ limit: 10 });

      // assert
      expect(result).toEqual([]);
    });

    test("招待コードが存在する場合、createdAtの降順で返す", async () => {
      // arrange
      const inviteCode1 = await inviteCodeFactory(ctx.db)
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const inviteCode2 = await inviteCodeFactory(ctx.db)
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await inviteCodeRepository.findAll({ limit: 10 });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.code).toBe(inviteCode2.code);
      expect(result[1]?.code).toBe(inviteCode1.code);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      await inviteCodeFactory(ctx.db).createList(3);

      // act
      const result = await inviteCodeRepository.findAll({ limit: 2 });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前の招待コードを返す", async () => {
      // arrange
      const inviteCode1 = await inviteCodeFactory(ctx.db)
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      await inviteCodeFactory(ctx.db)
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = "2024-01-01T01:30:00.000Z";

      // act
      const result = await inviteCodeRepository.findAll({
        limit: 10,
        cursor: cursorDate,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.code).toBe(inviteCode1.code);
    });

    test("未使用の招待コードの場合、usedByがnullになる", async () => {
      // arrange
      const inviteCode = await inviteCodeFactory(ctx.db).create();

      // act
      const result = await inviteCodeRepository.findAll({ limit: 10 });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        code: inviteCode.code,
        usedBy: null,
      });
    });

    test("使用済みの招待コードの場合、usedBy情報を含む", async () => {
      // arrange
      const actor = await actorFactory(ctx.db).create();
      const inviteCode = await inviteCodeFactory(ctx.db).create();
      await subscriptionFactory(ctx.db)
        .vars({
          actor: () => actor,
          inviteCode: () => inviteCode,
        })
        .create();

      // act
      const result = await inviteCodeRepository.findAll({ limit: 10 });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        code: inviteCode.code,
        usedBy: {
          did: actor.did,
          handle: actor.handle,
        },
      });
    });
  });

  describe("findFirst", () => {
    test("招待コードが存在しない場合、nullを返す", async () => {
      // arrange
      const nonExistentCode = "nonexistent-code";

      // act
      const result = await inviteCodeRepository.findFirst(nonExistentCode);

      // assert
      expect(result).toBeNull();
    });

    test("招待コードが存在する場合、InviteCode情報を返す", async () => {
      // arrange
      const inviteCode = await inviteCodeFactory(ctx.db).create();

      // act
      const result = await inviteCodeRepository.findFirst(inviteCode.code);

      // assert
      expect(result).toMatchObject({
        code: inviteCode.code,
        expiresAt: inviteCode.expiresAt,
        createdAt: inviteCode.createdAt,
      });
    });
  });

  describe("upsert", () => {
    test("新規招待コードを作成できる", async () => {
      // arrange
      const inviteCode = new InviteCode({
        code: "test-code-12345",
        expiresAt: new Date("2025-01-01T00:00:00.000Z"),
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      });

      // act
      await ctx.db.transaction(async (tx) => {
        await inviteCodeRepository.upsert({
          inviteCode,
          ctx: { db: tx },
        });
      });

      // assert
      const saved = await inviteCodeRepository.findFirst(inviteCode.code);
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
        await inviteCodeRepository.upsert({
          inviteCode: updatedInviteCode,
          ctx: { db: tx },
        });
      });

      // assert
      const saved = await inviteCodeRepository.findFirst(
        existingInviteCode.code,
      );
      expect(saved).toMatchObject({
        code: existingInviteCode.code,
        usedAt: updatedInviteCode.usedAt,
      });
    });
  });
});
