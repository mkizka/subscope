import {
  databaseFactory,
  JobQueue,
  LoggerManager,
  MetricReporter,
  TransactionManager,
} from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { UpsertIdentityUseCase } from "./application/actor/upsert-identity-use-case.js";
import { ResolveDidUseCase } from "./application/did/resolve-did-use-case.js";
import { IndexCommitUseCase } from "./application/index-commit-use-case.js";
import { IndexPostService } from "./application/post/index-post-service.js";
import { IndexProfileService } from "./application/profile/index-profile-service.js";
import { ActorRepository } from "./infrastructure/actor-repository.js";
import { DidResolver } from "./infrastructure/did-resolver.js";
import { PostRepository } from "./infrastructure/post-repository.js";
import { ProfileRepository } from "./infrastructure/profile-repository.js";
import { RecordRepository } from "./infrastructure/record-repository.js";
import { RedisDidCache } from "./infrastructure/redis-did-cache.js";
import { WorkerServer } from "./presentation/server.js";
import { SyncWorker } from "./presentation/worker.js";
import { env } from "./shared/env.js";

createInjector()
  // envs
  .provideValue("databaseUrl", env.DATABASE_URL)
  .provideValue("redisUrl", env.REDIS_URL)
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("redisUrl", env.REDIS_URL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("db", databaseFactory)
  .provideClass("transactionManager", TransactionManager)
  .provideClass("metricReporter", MetricReporter)
  .provideClass("didCache", RedisDidCache)
  .provideClass("didResolver", DidResolver)
  .provideClass("jobQueue", JobQueue)
  .provideClass("actorRepository", ActorRepository)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("postRepository", PostRepository)
  .provideClass("recordRepository", RecordRepository)
  // application
  .provideClass("upsertIdentityUseCase", UpsertIdentityUseCase)
  .provideClass("indexProfileService", IndexProfileService)
  .provideClass("indexPostService", IndexPostService)
  .provideClass("indexCommitUseCase", IndexCommitUseCase)
  .provideClass("resolveDidUseCase", ResolveDidUseCase)
  .provideClass("syncWorker", SyncWorker)
  // presentation
  .injectClass(WorkerServer)
  .start();
