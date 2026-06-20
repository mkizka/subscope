import { asClassArgs, createRegistry } from "@gyaku/di";
import type {
  IDidCache,
  IDidResolver,
  IJobQueue,
  IJobScheduler,
  ITapClient,
  ITransactionManager,
} from "@repo/common/domain";
import {
  connectionPoolFactory,
  databaseFactory,
  DidResolver,
  JobQueue,
  JobScheduler,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
  TapClient,
  TransactionManager,
} from "@repo/common/infrastructure";

import type { IActorRepository } from "../application/interfaces/repositories/actor-repository.js";
import type { IActorStatsRepository } from "../application/interfaces/repositories/actor-stats-repository.js";
import type { IFeedItemRepository } from "../application/interfaces/repositories/feed-item-repository.js";
import type { IFollowRepository } from "../application/interfaces/repositories/follow-repository.js";
import type { IGeneratorRepository } from "../application/interfaces/repositories/generator-repository.js";
import type { IInviteCodeRepository } from "../application/interfaces/repositories/invite-code-repository.js";
import type { ILikeRepository } from "../application/interfaces/repositories/like-repository.js";
import type { IPostRepository } from "../application/interfaces/repositories/post-repository.js";
import type { IPostStatsRepository } from "../application/interfaces/repositories/post-stats-repository.js";
import type { IProfileRepository } from "../application/interfaces/repositories/profile-repository.js";
import type { IRecordRepository } from "../application/interfaces/repositories/record-repository.js";
import type { IRepostRepository } from "../application/interfaces/repositories/repost-repository.js";
import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";
import { IndexActorService } from "../application/services/index-actor-service.js";
import { IndexRecordService } from "../application/services/index-record-service.js";
import { FollowIndexer } from "../application/services/indexer/follow-indexer.js";
import { GeneratorIndexer } from "../application/services/indexer/generator-indexer.js";
import { LikeIndexer } from "../application/services/indexer/like-indexer.js";
import { PostIndexer } from "../application/services/indexer/post-indexer.js";
import { ProfileIndexer } from "../application/services/indexer/profile-indexer.js";
import { RepostIndexer } from "../application/services/indexer/repost-indexer.js";
import { AddTapRepoUseCase } from "../application/use-cases/async/add-tap-repo-use-case.js";
import { AggregateActorStatsUseCase } from "../application/use-cases/async/aggregate-actor-stats-use-case.js";
import { AggregatePostStatsUseCase } from "../application/use-cases/async/aggregate-post-stats-use-case.js";
import { FetchRecordUseCase } from "../application/use-cases/async/fetch-record-use-case.js";
import { RemoveTapRepoUseCase } from "../application/use-cases/async/remove-tap-repo-use-case.js";
import { ResolveDidUseCase } from "../application/use-cases/async/resolve-did-use-case.js";
import { IndexCommitUseCase } from "../application/use-cases/commit/index-commit-use-case.js";
import { UpsertIdentityUseCase } from "../application/use-cases/identity/upsert-identity-use-case.js";
import { RecordFetcher } from "../infrastructure/fetchers/record-fetcher.js";
import { ActorRepository } from "../infrastructure/repositories/actor-repository/actor-repository.js";
import { ActorStatsRepository } from "../infrastructure/repositories/actor-stats-repository/actor-stats-repository.js";
import { FeedItemRepository } from "../infrastructure/repositories/feed-item-repository/feed-item-repository.js";
import { FollowRepository } from "../infrastructure/repositories/follow-repository/follow-repository.js";
import { GeneratorRepository } from "../infrastructure/repositories/generator-repository/generator-repository.js";
import { InviteCodeRepository } from "../infrastructure/repositories/invite-code-repository/invite-code-repository.js";
import { LikeRepository } from "../infrastructure/repositories/like-repository/like-repository.js";
import { PostRepository } from "../infrastructure/repositories/post-repository/post-repository.js";
import { PostStatsRepository } from "../infrastructure/repositories/post-stats-repository/post-stats-repository.js";
import { ProfileRepository } from "../infrastructure/repositories/profile-repository/profile-repository.js";
import { RecordRepository } from "../infrastructure/repositories/record-repository/record-repository.js";
import { RepostRepository } from "../infrastructure/repositories/repost-repository/repost-repository.js";
import { SubscriptionRepository } from "../infrastructure/repositories/subscription-repository/subscription-repository.js";
import { healthRouterFactory } from "../presentation/routes/health.js";
import { WorkerServer } from "../presentation/server.js";
import { SyncWorker } from "../presentation/worker.js";
import type { Env } from "./env.js";

// prettier-ignore
export const createWorkerRegistry = (env: Env) =>
  createRegistry()
    // envs
    .value("databaseUrl", env.DATABASE_URL)
    .value("redisUrl", env.REDIS_URL)
    .value("logLevel", env.LOG_LEVEL)
    .value("nodeEnv", env.NODE_ENV)
    .value("plcUrl", env.PLC_URL)
    .value("tapUrl", env.TAP_URL)
    .value("port", env.PORT)
    .value("commitWorkerConcurrency", env.COMMIT_WORKER_CONCURRENCY)
    // infrastructure
    .service("loggerManager", ["logLevel"], asClassArgs(LoggerManager))
    .service("tapClient", ["tapUrl"], asClassArgs<ITapClient>(TapClient))
    .service("connectionPool", ["databaseUrl"], ({ databaseUrl }) => connectionPoolFactory(databaseUrl))
    .service("db", ["connectionPool", "loggerManager"], ({ connectionPool, loggerManager }) => databaseFactory(connectionPool, loggerManager))
    .service("transactionManager", ["db"], asClassArgs<ITransactionManager>(TransactionManager))
    .service("metricReporter", () => new MetricReporter())
    .service("didCache", ["redisUrl", "metricReporter"], asClassArgs<IDidCache>(RedisDidCache))
    .service("didResolver", ["plcUrl", "loggerManager", "didCache", "metricReporter"], asClassArgs<IDidResolver>(DidResolver))
    .service("jobQueue", ["redisUrl"], asClassArgs<IJobQueue>(JobQueue))
    .service("recordFetcher", ["didResolver", "metricReporter"], asClassArgs(RecordFetcher))
    .service("actorRepository", ["db"], asClassArgs<IActorRepository>(ActorRepository))
    .service("inviteCodeRepository", ["db"], asClassArgs<IInviteCodeRepository>(InviteCodeRepository))
    .service("actorStatsRepository", ["db"], asClassArgs<IActorStatsRepository>(ActorStatsRepository))
    .service("profileRepository", ["db"], asClassArgs<IProfileRepository>(ProfileRepository))
    .service("postRepository", ["db"], asClassArgs<IPostRepository>(PostRepository))
    .service("recordRepository", ["db"], asClassArgs<IRecordRepository>(RecordRepository))
    .service("followRepository", ["db"], asClassArgs<IFollowRepository>(FollowRepository))
    .service("generatorRepository", ["db"], asClassArgs<IGeneratorRepository>(GeneratorRepository))
    .service("likeRepository", ["db"], asClassArgs<ILikeRepository>(LikeRepository))
    .service("postStatsRepository", ["db"], asClassArgs<IPostStatsRepository>(PostStatsRepository))
    .service("repostRepository", ["db"], asClassArgs<IRepostRepository>(RepostRepository))
    .service("subscriptionRepository", ["db"], asClassArgs<ISubscriptionRepository>(SubscriptionRepository))
    .service("feedItemRepository", ["db"], asClassArgs<IFeedItemRepository>(FeedItemRepository))
    // application(service)
    .service("jobScheduler", ["jobQueue"], asClassArgs<IJobScheduler>(JobScheduler))
    .service("profileIndexer", ["profileRepository"], asClassArgs(ProfileIndexer))
    .service("postIndexer", ["postRepository", "feedItemRepository", "jobScheduler"], asClassArgs(PostIndexer))
    .service("indexActorService", ["actorRepository", "profileRepository", "jobScheduler"], asClassArgs(IndexActorService))
    .service("followIndexer", ["followRepository", "jobScheduler", "indexActorService", "subscriptionRepository"], asClassArgs(FollowIndexer))
    .service("generatorIndexer", ["generatorRepository"], asClassArgs(GeneratorIndexer))
    .service("likeIndexer", ["likeRepository", "jobScheduler"], asClassArgs(LikeIndexer))
    .service("repostIndexer", ["repostRepository", "feedItemRepository", "postRepository", "jobScheduler"], asClassArgs(RepostIndexer))
    .service("indexRecordService", ["recordRepository", "indexActorService", "postIndexer", "profileIndexer", "followIndexer", "generatorIndexer", "likeIndexer", "repostIndexer"], asClassArgs(IndexRecordService))
    // application(use-case)
    .service("upsertIdentityUseCase", ["db", "indexActorService"], asClassArgs(UpsertIdentityUseCase))
    .service("indexCommitUseCase", ["transactionManager", "indexRecordService"], asClassArgs(IndexCommitUseCase))
    .service("resolveDidUseCase", ["didResolver", "actorRepository", "db"], asClassArgs(ResolveDidUseCase))
    .service("fetchRecordUseCase", ["recordFetcher", "transactionManager", "indexRecordService"], asClassArgs(FetchRecordUseCase))
    .service("aggregatePostStatsUseCase", ["postStatsRepository", "postRepository", "db"], asClassArgs(AggregatePostStatsUseCase))
    .service("aggregateActorStatsUseCase", ["actorStatsRepository", "actorRepository", "db"], asClassArgs(AggregateActorStatsUseCase))
    .service("addTapRepoUseCase", ["tapClient"], asClassArgs(AddTapRepoUseCase))
    .service("removeTapRepoUseCase", ["tapClient"], asClassArgs(RemoveTapRepoUseCase))
    .service("syncWorker", ["upsertIdentityUseCase", "indexCommitUseCase", "resolveDidUseCase", "fetchRecordUseCase", "aggregatePostStatsUseCase", "aggregateActorStatsUseCase", "addTapRepoUseCase", "removeTapRepoUseCase", "redisUrl", "commitWorkerConcurrency"], asClassArgs(SyncWorker))
    // presentation
    .service("healthRouter", ["nodeEnv", "logLevel", "port"], ({ nodeEnv, logLevel, port }) => healthRouterFactory({ NODE_ENV: nodeEnv, LOG_LEVEL: logLevel, PORT: port }))
    .service("workerServer", ["loggerManager", "syncWorker", "healthRouter", "port"], asClassArgs(WorkerServer));
