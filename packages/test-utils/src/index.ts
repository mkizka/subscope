import path from "node:path";

import type { TransactionContext } from "@dawn/common/domain";
import {
  connectionPoolFactory,
  databaseFactory,
  LoggerManager,
} from "@dawn/common/infrastructure";
import { required } from "@dawn/common/utils";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { execa } from "execa";
import { createInjector } from "typed-inject";
import { afterAll, beforeAll } from "vitest";

const createTestInjector = (databaseUrl: string) => {
  return createInjector()
    .provideValue("logLevel", "error" as const)
    .provideValue("databaseUrl", databaseUrl)
    .provideClass("loggerManager", LoggerManager)
    .provideFactory("connectionPool", connectionPoolFactory)
    .provideFactory("db", databaseFactory);
};

interface TestDatabaseSetup {
  testInjector: ReturnType<typeof createTestInjector>;
  ctx: TransactionContext;
}

export function setupTestDatabase() {
  let testSetup: TestDatabaseSetup;
  let postgresContainer: StartedPostgreSqlContainer;
  let connectionPool: ReturnType<typeof connectionPoolFactory>;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer(
      "postgres:16-alpine",
    ).start();
    const databaseUrl = postgresContainer.getConnectionUri();

    await execa({
      cwd: path.resolve(import.meta.dirname, "../../../"),
      env: {
        DATABASE_URL: databaseUrl,
      },
    })`pnpm db:migrate`;

    const testInjector = createTestInjector(databaseUrl);
    connectionPool = testInjector.resolve("connectionPool");

    testSetup = {
      testInjector,
      ctx: { db: testInjector.resolve("db") },
    };
  });

  afterAll(async () => {
    await connectionPool.end();
    await postgresContainer.stop();
  });

  return {
    getSetup: () => required(testSetup),
  };
}
