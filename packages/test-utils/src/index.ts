import type { DatabaseClient } from "@dawn/common/domain";
import {
  connectionPoolFactory,
  databaseFactory,
  LoggerManager,
} from "@dawn/common/infrastructure";
import { required } from "@dawn/common/utils";
import { execa } from "execa";
import type { StartedTestContainer } from "testcontainers";
import { GenericContainer } from "testcontainers";
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
  postgresContainer: StartedTestContainer;
  databaseUrl: string;
  injector: ReturnType<typeof createTestInjector>;
  connectionPool: ReturnType<typeof connectionPoolFactory>;
  db: DatabaseClient;
}

export function setupTestDatabase() {
  let testSetup: TestDatabaseSetup | null = null;

  beforeAll(async () => {
    const postgresContainer = await new GenericContainer("postgres:16-alpine")
      .withEnvironment({ POSTGRES_PASSWORD: "password" })
      .withExposedPorts(5432)
      .start();

    const databaseUrl = (() => {
      const url = new URL(
        `postgresql://${postgresContainer.getHost()}:${postgresContainer.getMappedPort(5432)}`,
      );
      url.username = "postgres";
      url.password = "password";
      url.pathname = "postgres";
      return url.toString();
    })();

    await execa({
      cwd: "../..",
      env: {
        DATABASE_URL: databaseUrl,
      },
    })`pnpm db:migrate`;

    const injector = createTestInjector(databaseUrl);

    testSetup = {
      postgresContainer,
      databaseUrl,
      injector,
      connectionPool: injector.resolve("connectionPool"),
      db: injector.resolve("db"),
    };
  });

  afterAll(async () => {
    const { connectionPool, postgresContainer } = required(testSetup);
    await connectionPool.end();
    await postgresContainer.stop();
    testSetup = null;
  });

  return {
    getSetup: () => required(testSetup),
  };
}
