import path from "node:path";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedRedisContainer } from "@testcontainers/redis";
import { RedisContainer } from "@testcontainers/redis";
import { execa } from "execa";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  interface ProvidedContext {
    databaseUrl: string;
    redisUrl: string;
  }
}

let postgresContainer: StartedPostgreSqlContainer;
let redisContainer: StartedRedisContainer;

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

const startRedis = async (project: TestProject) => {
  redisContainer = await new RedisContainer("redis:7-alpine").start();
  const redisUrl = redisContainer.getConnectionUrl();

  project.provide("redisUrl", redisUrl);
};

const startContainers = async (project: TestProject) => {
  await Promise.all([startPostgres(project), startRedis(project)]);
};

export const setup = async (project: TestProject) => {
  project.onTestsRerun(async () => {
    await teardown();
    await startContainers(project);
  });
  await startContainers(project);
};

export const teardown = async () => {
  await Promise.all([postgresContainer.stop(), redisContainer.stop()]);
};
