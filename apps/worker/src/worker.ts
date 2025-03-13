import {
  databaseFactory,
  DidResolver,
  JobQueue,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
  TransactionManager,
} from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { BackfillUseCase } from "./application/backfill-use-case.js";
import { IndexCommitUseCase } from "./application/index-commit-use-case.js";
import { ResolveDidUseCase } from "./application/resolve-did-use-case.js";
import { IndexActorService } from "./application/service/index-actor-service.js";
import { IndexCommitService } from "./application/service/index-commit-service.js";
import { IndexFollowService } from "./application/service/index-follow-service.js";
import { IndexPostService } from "./application/service/index-post-service.js";
import { IndexProfileService } from "./application/service/index-profile-service.js";
import { Temp__CleanupDatabaseUseCase } from "./application/temp__cleanup-database-usecase.js";
import { UpsertIdentityUseCase } from "./application/upsert-identity-use-case.js";
import { ActorRepository } from "./infrastructure/actor-repository.js";
import { FollowRepository } from "./infrastructure/follow-repository.js";
import { PostRepository } from "./infrastructure/post-repository.js";
import { ProfileRepository } from "./infrastructure/profile-repository.js";
import { RecordRepository } from "./infrastructure/record-repository.js";
import { RepoFetcher } from "./infrastructure/repo-fetcher.js";
import { WorkerServer } from "./presentation/server.js";
import { SyncWorker } from "./presentation/worker.js";
import { env } from "./shared/env.js";

createInjector()
  // envs
  .provideValue("databaseUrl", env.DATABASE_URL)
  .provideValue("redisUrl", env.REDIS_URL)
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("redisUrl", env.REDIS_URL)
  .provideValue("plcUrl", env.PLC_URL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("db", databaseFactory)
  .provideClass("transactionManager", TransactionManager)
  .provideClass("metricReporter", MetricReporter)
  .provideClass("didCache", RedisDidCache)
  .provideClass("didResolver", DidResolver)
  .provideClass("jobQueue", JobQueue)
  .provideClass("repoFetcher", RepoFetcher)
  .provideClass("actorRepository", ActorRepository)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("postRepository", PostRepository)
  .provideClass("recordRepository", RecordRepository)
  .provideClass("followRepository", FollowRepository)
  // application(service)
  .provideClass("indexProfileService", IndexProfileService)
  .provideClass("indexPostService", IndexPostService)
  .provideClass("indexActorService", IndexActorService)
  .provideClass("indexFollowService", IndexFollowService)
  .provideClass("indexCommitService", IndexCommitService)
  // application(use-case)
  .provideClass("upsertIdentityUseCase", UpsertIdentityUseCase)
  .provideClass("indexCommitUseCase", IndexCommitUseCase)
  .provideClass("resolveDidUseCase", ResolveDidUseCase)
  .provideClass("temp__cleanupDatabaseUseCase", Temp__CleanupDatabaseUseCase)
  .provideClass("backfillUseCase", BackfillUseCase)
  .provideClass("syncWorker", SyncWorker)
  // presentation
  .injectClass(WorkerServer)
  .start();
