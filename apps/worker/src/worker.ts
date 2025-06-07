import {
  connectionPoolFactory,
  databaseFactory,
  DidResolver,
  JobQueue,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
  TransactionManager,
} from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { IndexActorService } from "./application/services/actor/index-actor-service.js";
import { ResolveDidService } from "./application/services/actor/resolve-did-service.js";
import { BackfillService } from "./application/services/backfill/backfill-service.js";
import { FetchProfileService } from "./application/services/profile/fetch-profile-service.js";
import { IndexProfileService } from "./application/services/profile/index-profile-service.js";
import { IndexCommitService } from "./application/services/record/index-commit-service.js";
import { IndexFollowService } from "./application/services/record/index-follow-service.js";
import { IndexPostService } from "./application/services/record/index-post-service.js";
import { IndexSubscriptionService } from "./application/services/record/index-subscription-service.js";
import { BackfillUseCase } from "./application/use-cases/actor/backfill-use-case.js";
import { ResolveDidUseCase } from "./application/use-cases/actor/resolve-did-use-case.js";
import { UpsertIdentityUseCase } from "./application/use-cases/actor/upsert-identity-use-case.js";
import { Temp__CleanupDatabaseUseCase } from "./application/use-cases/maintenance/cleanup-database-use-case.js";
import { FetchProfileUseCase } from "./application/use-cases/profile/fetch-profile-use-case.js";
import { IndexCommitUseCase } from "./application/use-cases/record/index-commit-use-case.js";
import { ActorRepository } from "./infrastructure/actor-repository.js";
import { FollowRepository } from "./infrastructure/follow-repository.js";
import { PostRepository } from "./infrastructure/post-repository.js";
import { ProfileRecordFetcher } from "./infrastructure/profile-record-fetcher.js";
import { ProfileRepository } from "./infrastructure/profile-repository.js";
import { RecordRepository } from "./infrastructure/record-repository.js";
import { RepoFetcher } from "./infrastructure/repo-fetcher.js";
import { SubscriptionRepository } from "./infrastructure/subscription-repository.js";
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
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory)
  .provideClass("transactionManager", TransactionManager)
  .provideClass("metricReporter", MetricReporter)
  .provideClass("didCache", RedisDidCache)
  .provideClass("didResolver", DidResolver)
  .provideClass("jobQueue", JobQueue)
  .provideClass("repoFetcher", RepoFetcher)
  .provideClass("profileRecordFetcher", ProfileRecordFetcher)
  .provideClass("actorRepository", ActorRepository)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("postRepository", PostRepository)
  .provideClass("recordRepository", RecordRepository)
  .provideClass("followRepository", FollowRepository)
  .provideClass("subscriptionRepository", SubscriptionRepository)
  // application(service)
  .provideClass("resolveDidService", ResolveDidService)
  .provideClass("backfillService", BackfillService)
  .provideClass("fetchProfileService", FetchProfileService)
  .provideClass("indexProfileService", IndexProfileService)
  .provideClass("indexPostService", IndexPostService)
  .provideClass("indexActorService", IndexActorService)
  .provideClass("indexFollowService", IndexFollowService)
  .provideClass("indexSubscriptionService", IndexSubscriptionService)
  .provideClass("indexCommitService", IndexCommitService)
  // application(use-case)
  .provideClass("upsertIdentityUseCase", UpsertIdentityUseCase)
  .provideClass("indexCommitUseCase", IndexCommitUseCase)
  .provideClass("resolveDidUseCase", ResolveDidUseCase)
  .provideClass("fetchProfileUseCase", FetchProfileUseCase)
  .provideClass("temp__cleanupDatabaseUseCase", Temp__CleanupDatabaseUseCase)
  .provideClass("backfillUseCase", BackfillUseCase)
  .provideClass("syncWorker", SyncWorker)
  // presentation
  .injectClass(WorkerServer)
  .start();
