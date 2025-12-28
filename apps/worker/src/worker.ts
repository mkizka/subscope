import {
  connectionPoolFactory,
  databaseFactory,
  DidResolver,
  JobQueue,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
  TapClient,
  TransactionManager,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { IndexActorService } from "./application/services/index-actor-service.js";
import { IndexRecordService } from "./application/services/index-record-service.js";
import { FollowIndexer } from "./application/services/indexer/follow-indexer.js";
import { GeneratorIndexer } from "./application/services/indexer/generator-indexer.js";
import { LikeIndexer } from "./application/services/indexer/like-indexer.js";
import { PostIndexer } from "./application/services/indexer/post-indexer.js";
import { ProfileIndexer } from "./application/services/indexer/profile-indexer.js";
import { RepostIndexer } from "./application/services/indexer/repost-indexer.js";
import { AggregateActorStatsScheduler } from "./application/services/scheduler/aggregate-actor-stats-scheduler.js";
import { AggregatePostStatsScheduler } from "./application/services/scheduler/aggregate-post-stats-scheduler.js";
import { FetchRecordScheduler } from "./application/services/scheduler/fetch-record-scheduler.js";
import { ResolveDidScheduler } from "./application/services/scheduler/resolve-did-scheduler.js";
import { AggregateActorStatsUseCase } from "./application/use-cases/async/aggregate-actor-stats-use-case.js";
import { AggregatePostStatsUseCase } from "./application/use-cases/async/aggregate-post-stats-use-case.js";
import { FetchRecordUseCase } from "./application/use-cases/async/fetch-record-use-case.js";
import { ResolveDidUseCase } from "./application/use-cases/async/resolve-did-use-case.js";
import { IndexCommitUseCase } from "./application/use-cases/commit/index-commit-use-case.js";
import { UpsertIdentityUseCase } from "./application/use-cases/identity/upsert-identity-use-case.js";
import { RecordFetcher } from "./infrastructure/fetchers/record-fetcher.js";
import { ActorRepository } from "./infrastructure/repositories/actor-repository/actor-repository.js";
import { ActorStatsRepository } from "./infrastructure/repositories/actor-stats-repository/actor-stats-repository.js";
import { FeedItemRepository } from "./infrastructure/repositories/feed-item-repository/feed-item-repository.js";
import { FollowRepository } from "./infrastructure/repositories/follow-repository/follow-repository.js";
import { GeneratorRepository } from "./infrastructure/repositories/generator-repository/generator-repository.js";
import { InviteCodeRepository } from "./infrastructure/repositories/invite-code-repository/invite-code-repository.js";
import { LikeRepository } from "./infrastructure/repositories/like-repository/like-repository.js";
import { PostRepository } from "./infrastructure/repositories/post-repository/post-repository.js";
import { PostStatsRepository } from "./infrastructure/repositories/post-stats-repository/post-stats-repository.js";
import { ProfileRepository } from "./infrastructure/repositories/profile-repository/profile-repository.js";
import { RecordRepository } from "./infrastructure/repositories/record-repository/record-repository.js";
import { RepostRepository } from "./infrastructure/repositories/repost-repository/repost-repository.js";
import { SubscriptionRepository } from "./infrastructure/repositories/subscription-repository/subscription-repository.js";
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
  .provideValue("tapUrl", env.TAP_URL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideClass("tapClient", TapClient)
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory)
  .provideClass("transactionManager", TransactionManager)
  .provideClass("metricReporter", MetricReporter)
  .provideClass("didCache", RedisDidCache)
  .provideClass("didResolver", DidResolver)
  .provideClass("jobQueue", JobQueue)
  .provideClass("recordFetcher", RecordFetcher)
  .provideClass("actorRepository", ActorRepository)
  .provideClass("inviteCodeRepository", InviteCodeRepository)
  .provideClass("actorStatsRepository", ActorStatsRepository)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("postRepository", PostRepository)
  .provideClass("recordRepository", RecordRepository)
  .provideClass("followRepository", FollowRepository)
  .provideClass("generatorRepository", GeneratorRepository)
  .provideClass("likeRepository", LikeRepository)
  .provideClass("postStatsRepository", PostStatsRepository)
  .provideClass("repostRepository", RepostRepository)
  .provideClass("subscriptionRepository", SubscriptionRepository)
  .provideClass("feedItemRepository", FeedItemRepository)
  // application(service)
  .provideClass("resolveDidScheduler", ResolveDidScheduler)
  .provideClass("fetchRecordScheduler", FetchRecordScheduler)
  .provideClass("aggregatePostStatsScheduler", AggregatePostStatsScheduler)
  .provideClass("aggregateActorStatsScheduler", AggregateActorStatsScheduler)
  .provideClass("profileIndexer", ProfileIndexer)
  .provideClass("postIndexer", PostIndexer)
  .provideClass("indexActorService", IndexActorService)
  .provideClass("followIndexer", FollowIndexer)
  .provideClass("generatorIndexer", GeneratorIndexer)
  .provideClass("likeIndexer", LikeIndexer)
  .provideClass("repostIndexer", RepostIndexer)
  .provideClass("indexRecordService", IndexRecordService)
  // application(use-case)
  .provideClass("upsertIdentityUseCase", UpsertIdentityUseCase)
  .provideClass("indexCommitUseCase", IndexCommitUseCase)
  .provideClass("resolveDidUseCase", ResolveDidUseCase)
  .provideClass("fetchRecordUseCase", FetchRecordUseCase)
  .provideClass("aggregatePostStatsUseCase", AggregatePostStatsUseCase)
  .provideClass("aggregateActorStatsUseCase", AggregateActorStatsUseCase)
  .provideClass("syncWorker", SyncWorker)
  // presentation
  .injectClass(WorkerServer)
  .start();
