import { asDid } from "@atproto/did";
import { accountStatsFactory, testSetup } from "@repo/test-utils";
import { describe, expect, test } from "vitest";

import { AccountStatsQuery } from "./account-stats-query.js";

describe("AccountStatsQuery", () => {
  const { ctx } = testSetup;

  const accountStatsQuery = new AccountStatsQuery(ctx.db);

  describe("findStats", () => {
    test("空の配列が指定された場合、空の配列を返す", async () => {
      // act
      const result = await accountStatsQuery.findStats([]);

      // assert
      expect(result).toEqual([]);
    });

    test("統計が存在するアカウントの統計だけを返す", async () => {
      // arrange
      const accountStats = await accountStatsFactory(ctx.db).create();

      // act
      const result = await accountStatsQuery.findStats([
        asDid(accountStats.accountDid),
        asDid("did:plc:notexist123"),
      ]);

      // assert
      expect(result).toEqual([
        {
          accountDid: accountStats.accountDid,
          followsCount: accountStats.followsCount,
          followersCount: accountStats.followersCount,
          postsCount: accountStats.postsCount,
        },
      ]);
    });
  });
});
