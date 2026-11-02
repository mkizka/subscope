import { asDid } from "@atproto/did";
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
});
