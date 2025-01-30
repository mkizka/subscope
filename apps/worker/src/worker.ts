import {
  databaseFactory,
  LoggerManager,
  MetricReporter,
  TransactionManager,
} from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { UpsertIdentityUseCase } from "./application/actor/upsert-identity-use-case.js";
import { ResolveDidUseCase } from "./application/did/resolve-did-use-case.js";
import { UpsertPostUseCase } from "./application/post/upsert-post-use-case.js";
import { UpsertProfileUseCase } from "./application/profile/upsert-profile-use-case.js";
import { DidResolver } from "./infrastructure/atproto/did-resolver.js";
import { RedisDidCache } from "./infrastructure/atproto/redis-did-cache.js";
import { ActorRepository } from "./infrastructure/database/actor-repository.js";
import { PostRepository } from "./infrastructure/database/post-repository.js";
import { ProfileRepository } from "./infrastructure/database/profile-repository.js";
import { QueueService } from "./infrastructure/system/queue.js";
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
  .provideClass("queue", QueueService)
  // application
  .provideClass("upsertIdentityUseCase", UpsertIdentityUseCase)
  .provideClass("upsertProfileUseCase", UpsertProfileUseCase)
  .provideClass("upsertPostUseCase", UpsertPostUseCase)
  .provideClass("resolveDidUseCase", ResolveDidUseCase)
  .provideClass("syncWorker", SyncWorker)
  // presentation
  .injectClass(WorkerServer)
  .start();
