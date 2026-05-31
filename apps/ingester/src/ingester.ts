import { createRegistry } from "@gyaku/di";
import {
  JobQueue,
  LoggerManager,
  MetricReporter,
} from "@repo/common/infrastructure";

import { HandleCommitUseCase } from "./application/handle-commit-use-case.js";
import { HandleIdentityUseCase } from "./application/handle-identity-use-case.js";
import { RedisCursorRepository } from "./infrastructure/redis-cursor-repository.js";
import { LabelIngester } from "./presentation/label.js";
import { metricsRouterFactory } from "./presentation/routes/metrics.js";
import { IngesterServer } from "./presentation/server.js";
import { TapIngester } from "./presentation/tap.js";
import { env } from "./shared/env.js";

const registry = createRegistry()
  .value("logLevel", env.LOG_LEVEL)
  .value("redisUrl", env.REDIS_URL)
  .service(
    "loggerManager",
    ["logLevel"],
    ({ logLevel }) => new LoggerManager(logLevel),
  )
  .service("jobQueue", ["redisUrl"], ({ redisUrl }) => new JobQueue(redisUrl))
  .service("metricReporter", () => new MetricReporter())
  .service(
    "cursorRepository",
    ["redisUrl"],
    (deps) => new RedisCursorRepository(deps),
  )
  .service(
    "handleIdentityUseCase",
    ["loggerManager", "metricReporter", "jobQueue"],
    (deps) => new HandleIdentityUseCase(deps),
  )
  .service(
    "handleCommitUseCase",
    ["loggerManager", "metricReporter", "jobQueue"],
    (deps) => new HandleCommitUseCase(deps),
  )
  .service(
    "metricsRouter",
    ["jobQueue", "metricReporter"],
    ({ jobQueue, metricReporter }) =>
      metricsRouterFactory(jobQueue, metricReporter),
  )
  .service(
    "tapIngester",
    ["loggerManager", "handleCommitUseCase", "handleIdentityUseCase"],
    (deps) => new TapIngester(deps),
  )
  .service(
    "labelIngester",
    ["metricReporter"],
    (deps) => new LabelIngester(deps),
  )
  .service(
    "ingesterServer",
    ["loggerManager", "metricsRouter", "tapIngester", "labelIngester"],
    (deps) => new IngesterServer(deps),
  );

await using services = await registry.resolve();
services.ingesterServer.start();
