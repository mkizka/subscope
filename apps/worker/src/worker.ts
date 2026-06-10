import { createRegistry } from "@gyaku/di";
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
import { ac } from "@repo/common/utils";

import { IndexActorService } from "./application/services/index-actor-service.js";
import { IndexRecordService } from "./application/services/index-record-service.js";
import { FollowIndexer } from "./application/services/indexer/follow-indexer.js";
import { GeneratorIndexer } from "./application/services/indexer/generator-indexer.js";
import { LikeIndexer } from "./application/services/indexer/like-indexer.js";
import { PostIndexer } from "./application/services/indexer/post-indexer.js";
import { ProfileIndexer } from "./application/services/indexer/profile-indexer.js";
import { RepostIndexer } from "./application/services/indexer/repost-indexer.js";
import { AddTapRepoUseCase } from "./application/use-cases/async/add-tap-repo-use-case.js";
import { AggregateActorStatsUseCase } from "./application/use-cases/async/aggregate-actor-stats-use-case.js";
import { AggregatePostStatsUseCase } from "./application/use-cases/async/aggregate-post-stats-use-case.js";
import { FetchRecordUseCase } from "./application/use-cases/async/fetch-record-use-case.js";
import { RemoveTapRepoUseCase } from "./application/use-cases/async/remove-tap-repo-use-case.js";
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

// prettier-ignore
const services = await createRegistry()
  // envs
  .value("databaseUrl", env.DATABASE_URL)
  .value("redisUrl", env.REDIS_URL)
  .value("logLevel", env.LOG_LEVEL)
  .value("plcUrl", env.PLC_URL)
  .value("tapUrl", env.TAP_URL)
  // infrastructure
  .service("loggerManager", ["logLevel"], ac(LoggerManager))
  .service("tapClient", ["tapUrl"], ac(TapClient))
  .service("connectionPool", ["databaseUrl"], ({ databaseUrl }) => connectionPoolFactory(databaseUrl))
  .service("db", ["connectionPool", "loggerManager"], ({ connectionPool, loggerManager }) => databaseFactory(connectionPool, loggerManager))
  .service("transactionManager", ["db"], ac(TransactionManager))
  .service("metricReporter", () => new MetricReporter())
  .service("didCache", ["redisUrl", "metricReporter"], ac(RedisDidCache))
  .service("didResolver", ["plcUrl", "loggerManager", "didCache", "metricReporter"], ac(DidResolver))
  .service("jobQueue", ["redisUrl"], ac(JobQueue))
  .service("recordFetcher", ["didResolver", "metricReporter"], ac(RecordFetcher))
  .service("actorRepository", ["db"], ac(ActorRepository))
  .service("inviteCodeRepository", ["db"], ac(InviteCodeRepository))
  .service("actorStatsRepository", ["db"], ac(ActorStatsRepository))
  .service("profileRepository", ["db"], ac(ProfileRepository))
  .service("postRepository", ["db"], ac(PostRepository))
  .service("recordRepository", ["db"], ac(RecordRepository))
  .service("followRepository", ["db"], ac(FollowRepository))
  .service("generatorRepository", ["db"], ac(GeneratorRepository))
  .service("likeRepository", ["db"], ac(LikeRepository))
  .service("postStatsRepository", ["db"], ac(PostStatsRepository))
  .service("repostRepository", ["db"], ac(RepostRepository))
  .service("subscriptionRepository", ["db"], ac(SubscriptionRepository))
  .service("feedItemRepository", ["db"], ac(FeedItemRepository))
  // application(service)
  .service("jobScheduler", ["jobQueue"], ac(JobScheduler))
  .service("profileIndexer", ["profileRepository"], ac(ProfileIndexer))
  .service("postIndexer", ["postRepository", "feedItemRepository", "jobScheduler"], ac(PostIndexer))
  .service("indexActorService", ["actorRepository", "profileRepository", "jobScheduler"], ac(IndexActorService))
  .service("followIndexer", ["followRepository", "jobScheduler", "indexActorService", "subscriptionRepository"], ac(FollowIndexer))
  .service("generatorIndexer", ["generatorRepository"], ac(GeneratorIndexer))
  .service("likeIndexer", ["likeRepository", "jobScheduler"], ac(LikeIndexer))
  .service("repostIndexer", ["repostRepository", "feedItemRepository", "postRepository", "jobScheduler"], ac(RepostIndexer))
  .service("indexRecordService", ["recordRepository", "indexActorService", "postIndexer", "profileIndexer", "followIndexer", "generatorIndexer", "likeIndexer", "repostIndexer"], ac(IndexRecordService))
  // application(use-case)
  .service("upsertIdentityUseCase", ["db", "indexActorService"], ac(UpsertIdentityUseCase))
  .service("indexCommitUseCase", ["transactionManager", "indexRecordService"], ac(IndexCommitUseCase))
  .service("resolveDidUseCase", ["didResolver", "actorRepository", "db"], ac(ResolveDidUseCase))
  .service("fetchRecordUseCase", ["recordFetcher", "transactionManager", "indexRecordService"], ac(FetchRecordUseCase))
  .service("aggregatePostStatsUseCase", ["postStatsRepository", "postRepository", "db"], ac(AggregatePostStatsUseCase))
  .service("aggregateActorStatsUseCase", ["actorStatsRepository", "actorRepository", "db"], ac(AggregateActorStatsUseCase))
  .service("addTapRepoUseCase", ["tapClient"], ac(AddTapRepoUseCase))
  .service("removeTapRepoUseCase", ["tapClient"], ac(RemoveTapRepoUseCase))
  .service("syncWorker", ["upsertIdentityUseCase", "indexCommitUseCase", "resolveDidUseCase", "fetchRecordUseCase", "aggregatePostStatsUseCase", "aggregateActorStatsUseCase", "addTapRepoUseCase", "removeTapRepoUseCase"], ac(SyncWorker))
  // presentation
  .service("workerServer", ["loggerManager", "syncWorker"], ac(WorkerServer))
  .resolve();

services.workerServer.start();
