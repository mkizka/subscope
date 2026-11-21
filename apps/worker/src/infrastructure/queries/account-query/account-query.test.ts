import { asDid } from "@atproto/did";
import { schema } from "@repo/db";
import { accountFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { AccountQuery } from "./account-query.js";

describe("AccountQuery", () => {
  const { ctx } = testSetup;
  const accountQuery = new AccountQuery();

  describe("exists", () => {
    test("アカウントが存在しない場合、falseを返す", async () => {
      // arrange
      const did = asDid("did:plc:notexist");

      // act
      const result = await accountQuery.exists({ ctx, did });

      // assert
      expect(result).toBe(false);
    });

    test("アカウントが存在する場合、trueを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();

      // act
      const result = await accountQuery.exists({
        ctx,
        did: asDid(account.did),
      });

      // assert
      expect(result).toBe(true);
    });
  });

  describe("findTrackedAt", () => {
    test("追跡を始めた時刻が記録されている場合、その時刻を返す", async () => {
      // arrange
      const trackedAt = new Date("2026-01-10T00:00:00.000Z");
      const account = await accountFactory(ctx.db).create();
      await ctx.db
        .insert(schema.trackings)
        .values({ accountDid: account.did, trackedAt });

      // act
      const result = await accountQuery.findTrackedAt({
        ctx,
        did: asDid(account.did),
      });

      // assert
      expect(result).toEqual(trackedAt);
    });

    test("追跡を始めた時刻が記録されていない場合、nullを返す", async () => {
      // arrange
      const account = await accountFactory(ctx.db).create();

      // act
      const result = await accountQuery.findTrackedAt({
        ctx,
        did: asDid(account.did),
      });

      // assert
      expect(result).toBeNull();
    });
  });
});
