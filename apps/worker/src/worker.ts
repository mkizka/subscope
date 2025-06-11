import {
  connectionPoolFactory,
  databaseFactory,
  DidResolver,
  JobQueue,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
  TransactionManager,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { IndexActorService } from "./application/services/indexer/index-actor-service.js";
import { IndexCommitService } from "./application/services/indexer/index-commit-service.js";
import { IndexFollowService } from "./application/services/indexer/index-follow-service.js";
import { IndexPostService } from "./application/services/indexer/index-post-service.js";
import { IndexProfileService } from "./application/services/indexer/index-profile-service.js";
import { IndexRepostService } from "./application/services/indexer/index-repost-service.js";
import { IndexSubscriptionService } from "./application/services/indexer/index-subscription-service.js";
import { BackfillService } from "./application/services/scheduler/backfill-service.js";
import { FetchProfileService } from "./application/services/scheduler/fetch-profile-service.js";
import { ResolveDidService } from "./application/services/scheduler/resolve-did-service.js";
import { BackfillUseCase } from "./application/use-cases/async/backfill-use-case.js";
import { Temp__CleanupDatabaseUseCase } from "./application/use-cases/async/cleanup-database-use-case.js";
import { FetchProfileUseCase } from "./application/use-cases/async/fetch-profile-use-case.js";
import { ResolveDidUseCase } from "./application/use-cases/async/resolve-did-use-case.js";
import { IndexCommitUseCase } from "./application/use-cases/commit/index-commit-use-case.js";
import { UpsertIdentityUseCase } from "./application/use-cases/identity/upsert-identity-use-case.js";
import { ActorRepository } from "./infrastructure/actor-repository.js";
import { FollowRepository } from "./infrastructure/follow-repository.js";
import { PostRepository } from "./infrastructure/post-repository.js";
import { ProfileRecordFetcher } from "./infrastructure/profile-record-fetcher.js";
import { ProfileRepository } from "./infrastructure/profile-repository.js";
import { RecordFetcher } from "./infrastructure/record-fetcher.js";
import { RecordRepository } from "./infrastructure/record-repository.js";
import { RepoFetcher } from "./infrastructure/repo-fetcher.js";
import { RepostRepository } from "./infrastructure/repost-repository.js";
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
  .provideClass("recordFetcher", RecordFetcher)
  .provideClass("profileRecordFetcher", ProfileRecordFetcher)
  .provideClass("actorRepository", ActorRepository)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("postRepository", PostRepository)
  .provideClass("recordRepository", RecordRepository)
  .provideClass("followRepository", FollowRepository)
  .provideClass("repostRepository", RepostRepository)
  .provideClass("subscriptionRepository", SubscriptionRepository)
  // application(service)
  .provideClass("resolveDidService", ResolveDidService)
  .provideClass("backfillService", BackfillService)
  .provideClass("fetchProfileService", FetchProfileService)
  .provideClass("indexProfileService", IndexProfileService)
  .provideClass("indexPostService", IndexPostService)
  .provideClass("indexActorService", IndexActorService)
  .provideClass("indexFollowService", IndexFollowService)
  .provideClass("indexRepostService", IndexRepostService)
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
