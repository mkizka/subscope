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

import { IndexActorService } from "./application/services/index-actor-service.js";
import { IndexCommitService } from "./application/services/index-commit-service.js";
import { FollowIndexer } from "./application/services/indexer/follow-indexer.js";
import { LikeIndexer } from "./application/services/indexer/like-indexer.js";
import { PostIndexer } from "./application/services/indexer/post-indexer.js";
import { ProfileIndexer } from "./application/services/indexer/profile-indexer.js";
import { RepostIndexer } from "./application/services/indexer/repost-indexer.js";
import { SubscriptionIndexer } from "./application/services/indexer/subscription-indexer.js";
import { BackfillService } from "./application/services/scheduler/backfill-service.js";
import { FetchProfileService } from "./application/services/scheduler/fetch-profile-service.js";
import { ResolveDidService } from "./application/services/scheduler/resolve-did-service.js";
import { BackfillUseCase } from "./application/use-cases/async/backfill-use-case.js";
import { Temp__CleanupDatabaseUseCase } from "./application/use-cases/async/cleanup-database-use-case.js";
import { FetchProfileUseCase } from "./application/use-cases/async/fetch-profile-use-case.js";
import { ResolveDidUseCase } from "./application/use-cases/async/resolve-did-use-case.js";
import { IndexCommitUseCase } from "./application/use-cases/commit/index-commit-use-case.js";
import { UpsertIdentityUseCase } from "./application/use-cases/identity/upsert-identity-use-case.js";
import { FollowIndexingPolicy } from "./domain/follow-indexing-policy.js";
import { LikeIndexingPolicy } from "./domain/like-indexing-policy.js";
import { PostIndexingPolicy } from "./domain/post-indexing-policy.js";
import { ProfileIndexingPolicy } from "./domain/profile-indexing-policy.js";
import { RepostIndexingPolicy } from "./domain/repost-indexing-policy.js";
import { SubscriptionIndexingPolicy } from "./domain/subscription-indexing-policy.js";
import { ActorRepository } from "./infrastructure/actor-repository.js";
import { FollowRepository } from "./infrastructure/follow-repository.js";
import { LikeRepository } from "./infrastructure/like-repository.js";
import { PostRepository } from "./infrastructure/post-repository.js";
import { ProfileRecordFetcher } from "./infrastructure/profile-record-fetcher.js";
import { ProfileRepository } from "./infrastructure/profile-repository.js";
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
  .provideClass("profileRecordFetcher", ProfileRecordFetcher)
  .provideClass("actorRepository", ActorRepository)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("postRepository", PostRepository)
  .provideClass("recordRepository", RecordRepository)
  .provideClass("followRepository", FollowRepository)
  .provideClass("likeRepository", LikeRepository)
  .provideClass("repostRepository", RepostRepository)
  .provideClass("subscriptionRepository", SubscriptionRepository)
  // application(service)
  .provideClass("resolveDidService", ResolveDidService)
  .provideClass("backfillService", BackfillService)
  .provideClass("fetchProfileService", FetchProfileService)
  .provideClass("postIndexingPolicy", PostIndexingPolicy)
  .provideClass("likeIndexingPolicy", LikeIndexingPolicy)
  .provideClass("followIndexingPolicy", FollowIndexingPolicy)
  .provideClass("profileIndexingPolicy", ProfileIndexingPolicy)
  .provideClass("repostIndexingPolicy", RepostIndexingPolicy)
  .provideClass("subscriptionIndexingPolicy", SubscriptionIndexingPolicy)
  .provideClass("profileIndexer", ProfileIndexer)
  .provideClass("postIndexer", PostIndexer)
  .provideClass("indexActorService", IndexActorService)
  .provideClass("followIndexer", FollowIndexer)
  .provideClass("likeIndexer", LikeIndexer)
  .provideClass("repostIndexer", RepostIndexer)
  .provideClass("subscriptionIndexer", SubscriptionIndexer)
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
