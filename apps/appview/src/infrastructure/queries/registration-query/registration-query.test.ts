import {
  accountFactory,
  registrationFactory,
  testSetup,
} from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { RegistrationQuery } from "./registration-query.js";

describe("RegistrationQuery", () => {
  const { ctx } = testSetup;

  const registrationQuery = new RegistrationQuery(ctx.db);

  describe("findMany", () => {
    test("登録が存在しない場合、空の配列を返す", async () => {
      // act
      const result = await registrationQuery.findMany({ limit: 10 });

      // assert
      expect(result).toEqual([]);
    });

    test("登録が存在する場合、createdAtの降順で返す", async () => {
      // arrange
      const account1 = await accountFactory(ctx.db).create();
      const registration1 = await registrationFactory(ctx.db)
        .vars({ account: () => account1 })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const account2 = await accountFactory(ctx.db).create();
      const registration2 = await registrationFactory(ctx.db)
        .vars({ account: () => account2 })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      // act
      const result = await registrationQuery.findMany({ limit: 10 });

      // assert
      expect(result).toHaveLength(2);
      expect(result[0]?.accountDid).toBe(registration2.accountDid);
      expect(result[1]?.accountDid).toBe(registration1.accountDid);
    });

    test("limitパラメータが指定された場合、その件数だけ返す", async () => {
      // arrange
      const accounts = await accountFactory(ctx.db).createList(3);
      await Promise.all(
        accounts.map((account) =>
          registrationFactory(ctx.db)
            .vars({ account: () => account })
            .create(),
        ),
      );

      // act
      const result = await registrationQuery.findMany({ limit: 2 });

      // assert
      expect(result).toHaveLength(2);
    });

    test("cursorパラメータが指定された場合、そのカーソル以前の登録を返す", async () => {
      // arrange
      const account1 = await accountFactory(ctx.db).create();
      const registration1 = await registrationFactory(ctx.db)
        .vars({ account: () => account1 })
        .props({
          createdAt: () => new Date("2024-01-01T01:00:00.000Z"),
        })
        .create();

      const account2 = await accountFactory(ctx.db).create();
      await registrationFactory(ctx.db)
        .vars({ account: () => account2 })
        .props({
          createdAt: () => new Date("2024-01-01T02:00:00.000Z"),
        })
        .create();

      const cursorDate = "2024-01-01T01:30:00.000Z";

      // act
      const result = await registrationQuery.findMany({
        limit: 10,
        cursor: cursorDate,
      });

      // assert
      expect(result).toHaveLength(1);
      expect(result[0]?.accountDid).toBe(registration1.accountDid);
    });
  });
});
