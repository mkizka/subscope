import path from "node:path";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { execa } from "execa";
import type { TestProject } from "vitest/node";

let postgresContainer: StartedPostgreSqlContainer;

const startPostgres = async (project: TestProject) => {
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

  project.provide("databaseUrl", databaseUrl);
};

export const setup = async (project: TestProject) => {
  project.onTestsRerun(async () => {
    await teardown();
    await startPostgres(project);
  });
  await startPostgres(project);
};

export const teardown = async () => {
  await postgresContainer.stop();
};
