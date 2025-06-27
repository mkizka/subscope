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
import { IndexRecordService } from "./application/services/index-record-service.js";
import { FollowIndexer } from "./application/services/indexer/follow-indexer.js";
import { LikeIndexer } from "./application/services/indexer/like-indexer.js";
import { PostIndexer } from "./application/services/indexer/post-indexer.js";
import { ProfileIndexer } from "./application/services/indexer/profile-indexer.js";
import { RepostIndexer } from "./application/services/indexer/repost-indexer.js";
import { SubscriptionIndexer } from "./application/services/indexer/subscription-indexer.js";
import { BackfillScheduler } from "./application/services/scheduler/backfill-scheduler.js";
import { FetchRecordScheduler } from "./application/services/scheduler/fetch-record-scheduler.js";
import { ResolveDidScheduler } from "./application/services/scheduler/resolve-did-scheduler.js";
import { BackfillUseCase } from "./application/use-cases/async/backfill-use-case.js";
import { Temp__CleanupDatabaseUseCase } from "./application/use-cases/async/cleanup-database-use-case.js";
import { FetchRecordUseCase } from "./application/use-cases/async/fetch-record-use-case.js";
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
import { ActorStatsRepository } from "./infrastructure/actor-stats-repository.js";
import { FollowRepository } from "./infrastructure/follow-repository.js";
import { LikeRepository } from "./infrastructure/like-repository.js";
import { PostRepository } from "./infrastructure/post-repository.js";
import { PostStatsRepository } from "./infrastructure/post-stats-repository.js";
import { ProfileRepository } from "./infrastructure/profile-repository.js";
import { RecordFetcher } from "./infrastructure/record-fetcher.js";
import { RecordRepository } from "./infrastructure/record-repository.js";
import { RepoFetcher } from "./infrastructure/repo-fetcher.js";
import { FeedItemRepository } from "./infrastructure/repositories/feed-item-repository.js";
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
  .provideClass("actorRepository", ActorRepository)
  .provideClass("actorStatsRepository", ActorStatsRepository)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("postRepository", PostRepository)
  .provideClass("recordRepository", RecordRepository)
  .provideClass("followRepository", FollowRepository)
  .provideClass("likeRepository", LikeRepository)
  .provideClass("postStatsRepository", PostStatsRepository)
  .provideClass("repostRepository", RepostRepository)
  .provideClass("subscriptionRepository", SubscriptionRepository)
  .provideClass("feedItemRepository", FeedItemRepository)
  // application(service)
  .provideClass("resolveDidScheduler", ResolveDidScheduler)
  .provideClass("backfillScheduler", BackfillScheduler)
  .provideClass("fetchRecordScheduler", FetchRecordScheduler)
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
  .provideClass("indexRecordService", IndexRecordService)
  // application(use-case)
  .provideClass("upsertIdentityUseCase", UpsertIdentityUseCase)
  .provideClass("indexCommitUseCase", IndexCommitUseCase)
  .provideClass("resolveDidUseCase", ResolveDidUseCase)
  .provideClass("fetchRecordUseCase", FetchRecordUseCase)
  .provideClass("temp__cleanupDatabaseUseCase", Temp__CleanupDatabaseUseCase)
  .provideClass("backfillUseCase", BackfillUseCase)
  .provideClass("syncWorker", SyncWorker)
  // presentation
  .injectClass(WorkerServer)
  .start();
