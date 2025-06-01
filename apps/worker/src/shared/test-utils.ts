import type { DatabaseClient } from "@dawn/common/domain";
import {
  connectionPoolFactory,
  databaseFactory,
  LoggerManager,
} from "@dawn/common/infrastructure";
import { execa } from "execa";
import type { StartedTestContainer } from "testcontainers";
import { GenericContainer } from "testcontainers";
import { createInjector } from "typed-inject";

interface TestDatabaseSetup {
  postgresContainer: StartedTestContainer;
  databaseUrl: string;
  injector: ReturnType<typeof createInjector>;
  connectionPool: ReturnType<typeof connectionPoolFactory>;
  db: DatabaseClient;
}

export async function setupTestDatabase(): Promise<TestDatabaseSetup> {
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

  const injector = createInjector()
    .provideValue("logLevel", "error" as const)
    .provideValue("databaseUrl", databaseUrl)
    .provideClass("loggerManager", LoggerManager)
    .provideFactory("connectionPoolFactory", connectionPoolFactory)
    .provideFactory("db", databaseFactory);

  const connectionPool = injector.resolve("connectionPoolFactory");
  const db = injector.resolve("db");

  return {
    postgresContainer,
    databaseUrl,
    injector,
    connectionPool,
    db,
  };
}

export async function teardownTestDatabase(
  setup: TestDatabaseSetup,
): Promise<void> {
  await setup.connectionPool.end();
  await setup.postgresContainer.stop();
}
