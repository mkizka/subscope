import {
  actorFactory,
  inviteCodeFactory,
  subscriptionFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { InviteCodeQuery } from "./invite-code-query.js";

describe("InviteCodeQuery", () => {
  const { ctx } = testSetup;

  const inviteCodeQuery = new InviteCodeQuery(ctx.db);

  describe("findAll", () => {
    test("招待コードが存在しない場合、空の配列を返す", async () => {
      // act
      const result = await inviteCodeQuery.findAll({ limit: 10 });

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
      const result = await inviteCodeQuery.findAll({ limit: 10 });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.code).toBe(inviteCode2.code);
      expect(result[1]?.code).toBe(inviteCode1.code);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      await inviteCodeFactory(ctx.db).createList(3);

      // act
      const result = await inviteCodeQuery.findAll({ limit: 2 });

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
      const result = await inviteCodeQuery.findAll({
        limit: 10,
        cursor: cursorDate,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.code).toBe(inviteCode1.code);
    });

    test("未使用の招待コードの場合、usedByDidがnullになる", async () => {
      // arrange
      const inviteCode = await inviteCodeFactory(ctx.db).create();

      // act
      const result = await inviteCodeQuery.findAll({ limit: 10 });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        code: inviteCode.code,
        usedByDid: null,
      });
    });

    test("使用済みの招待コードの場合、usedByDidを含む", async () => {
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
      const result = await inviteCodeQuery.findAll({ limit: 10 });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        code: inviteCode.code,
        usedByDid: actor.did,
      });
    });
  });
});
