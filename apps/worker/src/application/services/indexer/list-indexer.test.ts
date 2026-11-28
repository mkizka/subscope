import { describe, expect, test } from "vitest";

import { accountFactory } from "../../../domain/account.factory.js";
import { Origin } from "../../../domain/origin.js";
import { recordFactory } from "../../../domain/record.factory.js";
import { afterCommit, testRegistry } from "../../../shared/test-utils.js";

describe("ListIndexer", () => {
  test("リストレコードを正しく保存する", async () => {
    // arrange
    const { listIndexer, listRepository, registrationQuery, db } =
      await testRegistry.resolve();
    const account = accountFactory();
    registrationQuery.add(account.did);
    const record = recordFactory({
      uri: `at://${account.did}/app.bsky.graph.list/listrkey123`,
      json: {
        $type: "app.bsky.graph.list",
        purpose: "app.bsky.graph.defs#curatelist",
        name: "テストリスト",
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await listIndexer.index({
      ctx: { db, afterCommit },
      record,
      origin: Origin.live(),
    });

    // assert
    expect(
      await listRepository.find({ ctx: { db }, uri: record.uri }),
    ).toMatchObject({
      accountDid: account.did,
      purpose: "app.bsky.graph.defs#curatelist",
      name: "テストリスト",
    });
  });
});
