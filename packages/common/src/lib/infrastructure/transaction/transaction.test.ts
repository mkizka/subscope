import { beforeEach, describe, expect, test } from "vitest";

import type { DatabaseClient } from "../../domain/interfaces/transaction.js";
import { InMemoryTransactionManager } from "./transaction.in-memory.js";
import { TransactionManager } from "./transaction.js";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const db = {
  transaction: (fn: (tx: unknown) => Promise<unknown>) => fn({}),
} as unknown as DatabaseClient;

describe.each([
  ["TransactionManager", new TransactionManager(db)],
  ["InMemoryTransactionManager", new InMemoryTransactionManager()],
])("%s", (_, transactionManager) => {
  const calls: string[] = [];
  const record = (name: string) => () => {
    calls.push(name);
    return Promise.resolve();
  };

  beforeEach(() => {
    calls.length = 0;
  });

  test("afterCommitに登録した処理をコミット後に順番に実行する", async () => {
    // act
    await transactionManager.transaction((ctx) => {
      ctx.afterCommit(record("task1"));
      ctx.afterCommit(record("task2"));
      return record("transaction")();
    });

    // assert
    expect(calls).toEqual(["transaction", "task1", "task2"]);
  });

  test("トランザクションが失敗した場合はafterCommitに登録した処理を実行しない", async () => {
    // act
    const promise = transactionManager.transaction((ctx) => {
      ctx.afterCommit(record("task"));
      return Promise.reject(new Error("rollback"));
    });

    // assert
    await expect(promise).rejects.toThrow("rollback");
    expect(calls).toEqual([]);
  });
});
