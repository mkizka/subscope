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
import { UpsertPostUseCase } from "./application/post/upsert-post-use-case.js";
import { UpsertProfileUseCase } from "./application/profile/upsert-profile-use-case.js";
import { ActorRepository } from "./infrastructure/actor-repository.js";
import { DidResolver } from "./infrastructure/did-resolver.js";
import { PostRepository } from "./infrastructure/post-repository.js";
import { ProfileRepository } from "./infrastructure/profile-repository.js";
import { RedisDidCache } from "./infrastructure/redis-did-cache.js";
import { WorkerServer } from "./presentation/server.js";
import { SyncWorker } from "./presentation/worker.js";
import { env } from "./shared/env.js";

createInjector()
  // infrastructure
  .provideValue("config", env)
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("db", databaseFactory)
  .provideClass("transactionManager", TransactionManager)
  .provideClass("metricReporter", MetricReporter)
  .provideClass("didCache", RedisDidCache)
  .provideClass("didResolver", DidResolver)
  .provideClass("actorRepository", ActorRepository)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("postRepository", PostRepository)
  .provideValue("redisUrl", env.REDIS_URL)
  .provideClass("jobQueue", JobQueue)
  // application
  .provideClass("upsertIdentityUseCase", UpsertIdentityUseCase)
  .provideClass("upsertProfileUseCase", UpsertProfileUseCase)
  .provideClass("upsertPostUseCase", UpsertPostUseCase)
  .provideClass("resolveDidUseCase", ResolveDidUseCase)
  .provideClass("syncWorker", SyncWorker)
  // presentation
  .injectClass(WorkerServer)
  .start();
