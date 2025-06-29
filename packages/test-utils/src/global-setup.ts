import path from "node:path";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { execa } from "execa";

let postgresContainer: StartedPostgreSqlContainer;

export const setup = async () => {
  if (process.env.TEST_DATABASE_URL) {
    return;
  }
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

  process.env.TEST_DATABASE_URL = databaseUrl;
};

export const teardown = async () => {
  await postgresContainer.stop();
};
