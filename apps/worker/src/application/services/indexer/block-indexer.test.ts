import { describe, expect, test } from "vitest";

import { accountFactory } from "../../../domain/account.factory.js";
import { afterCommit, testRegistry } from "../../../shared/test-utils.js";
import { recordFactory } from "../../dto/record.factory.js";

describe("BlockIndexer", () => {
  test("ブロックレコードを保存し、対象アカウントを作成する", async () => {
    // arrange
    const { blockIndexer, blockRepository, accountRepository, db } =
      await testRegistry.resolve();
    const account = accountFactory();
    const subject = accountFactory();
    const record = recordFactory({
      uri: `at://${account.did}/app.bsky.graph.block/blockrkey123`,
      json: {
        $type: "app.bsky.graph.block",
        subject: subject.did,
        createdAt: new Date().toISOString(),
      },
    });

    // act
    await blockIndexer.upsert({
      ctx: { db, afterCommit },
      record,
      live: false,
    });

    // assert
    expect(
      await blockRepository.find({ ctx: { db }, uri: record.uri }),
    ).toMatchObject({
      accountDid: account.did,
      subjectDid: subject.did,
    });
    expect(
      await accountRepository.find({ ctx: { db }, did: subject.did }),
    ).not.toBeNull();
  });
});
