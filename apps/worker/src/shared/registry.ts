import { asClassArgs, asFunctionArgs, createRegistry } from "@gyaku/di";
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

import type { IHandleResolver } from "../application/interfaces/external/handle-resolver.js";
import type { ILabelCursorStore } from "../application/interfaces/external/label-cursor-store.js";
import type { ILabelFetcher } from "../application/interfaces/external/label-fetcher.js";
import type { IActorRepository } from "../application/interfaces/repositories/actor-repository.js";
import type { IActorStatsRepository } from "../application/interfaces/repositories/actor-stats-repository.js";
import type { IFeedItemRepository } from "../application/interfaces/repositories/feed-item-repository.js";
import type { IFollowRepository } from "../application/interfaces/repositories/follow-repository.js";
import type { IGeneratorRepository } from "../application/interfaces/repositories/generator-repository.js";
import type { IInviteCodeRepository } from "../application/interfaces/repositories/invite-code-repository.js";
import type { ILabelRepository } from "../application/interfaces/repositories/label-repository.js";
import type { ILikeRepository } from "../application/interfaces/repositories/like-repository.js";
import type { IListItemRepository } from "../application/interfaces/repositories/list-item-repository.js";
import type { IListRepository } from "../application/interfaces/repositories/list-repository.js";
import type { INotificationRepository } from "../application/interfaces/repositories/notification-repository.js";
import type { IPostRepository } from "../application/interfaces/repositories/post-repository.js";
import type { IPostStatsRepository } from "../application/interfaces/repositories/post-stats-repository.js";
import type { IProfileRepository } from "../application/interfaces/repositories/profile-repository.js";
import type { IRecordRepository } from "../application/interfaces/repositories/record-repository.js";
import type { IRecordRevRepository } from "../application/interfaces/repositories/record-rev-repository.js";
import type { IRepostRepository } from "../application/interfaces/repositories/repost-repository.js";
import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";
import { IndexActorService } from "../application/services/index-actor-service.js";
import { IndexRecordService } from "../application/services/index-record-service.js";
import { FollowIndexer } from "../application/services/indexer/follow-indexer.js";
import { GateIndexer } from "../application/services/indexer/gate-indexer.js";
import { GeneratorIndexer } from "../application/services/indexer/generator-indexer.js";
import { LikeIndexer } from "../application/services/indexer/like-indexer.js";
import { ListIndexer } from "../application/services/indexer/list-indexer.js";
import { ListItemIndexer } from "../application/services/indexer/list-item-indexer.js";
import { PostIndexer } from "../application/services/indexer/post-indexer.js";
import { ProfileIndexer } from "../application/services/indexer/profile-indexer.js";
import { RepostIndexer } from "../application/services/indexer/repost-indexer.js";
import { AggregateActorStatsUseCase } from "../application/use-cases/async/aggregate-actor-stats-use-case.js";
import { AggregatePostStatsUseCase } from "../application/use-cases/async/aggregate-post-stats-use-case.js";
import { FetchRecordUseCase } from "../application/use-cases/async/fetch-record-use-case.js";
import { ResolveDidUseCase } from "../application/use-cases/async/resolve-did-use-case.js";
import { SyncTapRepoUseCase } from "../application/use-cases/async/sync-tap-repo-use-case.js";
import { IndexCommitUseCase } from "../application/use-cases/commit/index-commit-use-case.js";
import { UpsertIdentityUseCase } from "../application/use-cases/identity/upsert-identity-use-case.js";
import { IndexLabelUseCase } from "../application/use-cases/label/index-label-use-case.js";
import { LabelFetcher } from "../infrastructure/fetchers/label-fetcher.js";
import { RecordFetcher } from "../infrastructure/fetchers/record-fetcher.js";
import { HandleResolver } from "../infrastructure/handle-resolver/handle-resolver.js";
import { LabelCursorStore } from "../infrastructure/label-cursor-store/label-cursor-store.js";
import { ActorRepository } from "../infrastructure/repositories/actor-repository/actor-repository.js";
import { ActorStatsRepository } from "../infrastructure/repositories/actor-stats-repository/actor-stats-repository.js";
import { FeedItemRepository } from "../infrastructure/repositories/feed-item-repository/feed-item-repository.js";
import { FollowRepository } from "../infrastructure/repositories/follow-repository/follow-repository.js";
import { GeneratorRepository } from "../infrastructure/repositories/generator-repository/generator-repository.js";
import { InviteCodeRepository } from "../infrastructure/repositories/invite-code-repository/invite-code-repository.js";
import { LabelRepository } from "../infrastructure/repositories/label-repository/label-repository.js";
import { LikeRepository } from "../infrastructure/repositories/like-repository/like-repository.js";
import { ListItemRepository } from "../infrastructure/repositories/list-item-repository/list-item-repository.js";
import { ListRepository } from "../infrastructure/repositories/list-repository/list-repository.js";
import { NotificationRepository } from "../infrastructure/repositories/notification-repository/notification-repository.js";
import { PostRepository } from "../infrastructure/repositories/post-repository/post-repository.js";
import { PostStatsRepository } from "../infrastructure/repositories/post-stats-repository/post-stats-repository.js";
import { ProfileRepository } from "../infrastructure/repositories/profile-repository/profile-repository.js";
import { RecordRepository } from "../infrastructure/repositories/record-repository/record-repository.js";
import { RecordRevRepository } from "../infrastructure/repositories/record-rev-repository/record-rev-repository.js";
import { RepostRepository } from "../infrastructure/repositories/repost-repository/repost-repository.js";
import { SubscriptionRepository } from "../infrastructure/repositories/subscription-repository/subscription-repository.js";
import { LabelSubscriber } from "../presentation/label-subscriber.js";
import { healthRouterFactory } from "../presentation/routes/health.js";
import { WorkerServer } from "../presentation/server.js";
import { TapSubscriber } from "../presentation/tap.js";
import { SyncWorker } from "../presentation/worker.js";
import type { Env } from "./env.js";

// prettier-ignore
export const createWorkerRegistry = (env: Env) =>
  createRegistry()
    // envs
    .value("databaseUrl", env.DATABASE_URL)
    .value("databasePoolMax", env.DATABASE_POOL_MAX)
    .value("redisUrl", env.REDIS_URL)
    .value("logLevel", env.LOG_LEVEL)
    .value("nodeEnv", env.NODE_ENV)
    .value("plcUrl", env.PLC_URL)
    .value("handleResolverUrl", env.ATPROTO_HANDLE_RESOLVER_URL)
    .value("tapUrl", env.TAP_URL)
    .value("moderationUrl", env.MODERATION_URL)
    .value("port", env.PORT)
    .value("tapConcurrency", env.TAP_CONCURRENCY)
    // infrastructure
    .service("loggerManager", ["logLevel"], asClassArgs(LoggerManager))
    .service("tapClient", ["tapUrl"], asClassArgs<ITapClient>()(TapClient))
    .service("connectionPool", ["databaseUrl", "databasePoolMax"], connectionPoolFactory)
    .service("db", ["connectionPool", "loggerManager"], asFunctionArgs(databaseFactory))
    .service("transactionManager", ["db"], asClassArgs<ITransactionManager>()(TransactionManager))
    .service("metricReporter", asClassArgs(MetricReporter))
    .service("didCache", ["redisUrl", "metricReporter"], asClassArgs<IDidCache>()(RedisDidCache))
    .service("didResolver", ["plcUrl", "loggerManager", "didCache", "metricReporter"], asClassArgs<IDidResolver>()(DidResolver))
    .service("jobQueue", ["redisUrl"], asClassArgs<IJobQueue>()(JobQueue))
    .service("handleResolver", ["handleResolverUrl"], asClassArgs<IHandleResolver>()(HandleResolver))
    .service("labelCursorStore", ["redisUrl"], asClassArgs<ILabelCursorStore>()(LabelCursorStore))
    .service("labelFetcher", ["moderationUrl"], asClassArgs<ILabelFetcher>()(LabelFetcher))
    .service("recordFetcher", ["didResolver", "metricReporter"], asClassArgs(RecordFetcher))
    .service("actorRepository", asClassArgs<IActorRepository>()(ActorRepository))
    .service("inviteCodeRepository", asClassArgs<IInviteCodeRepository>()(InviteCodeRepository))
    .service("actorStatsRepository", asClassArgs<IActorStatsRepository>()(ActorStatsRepository))
    .service("profileRepository", asClassArgs<IProfileRepository>()(ProfileRepository))
    .service("postRepository", asClassArgs<IPostRepository>()(PostRepository))
    .service("recordRepository", asClassArgs<IRecordRepository>()(RecordRepository))
    .service("recordRevRepository", asClassArgs<IRecordRevRepository>()(RecordRevRepository))
    .service("followRepository", asClassArgs<IFollowRepository>()(FollowRepository))
    .service("generatorRepository", asClassArgs<IGeneratorRepository>()(GeneratorRepository))
    .service("listRepository", asClassArgs<IListRepository>()(ListRepository))
    .service("listItemRepository", asClassArgs<IListItemRepository>()(ListItemRepository))
    .service("likeRepository", asClassArgs<ILikeRepository>()(LikeRepository))
    .service("postStatsRepository", asClassArgs<IPostStatsRepository>()(PostStatsRepository))
    .service("repostRepository", asClassArgs<IRepostRepository>()(RepostRepository))
    .service("subscriptionRepository", asClassArgs<ISubscriptionRepository>()(SubscriptionRepository))
    .service("feedItemRepository", asClassArgs<IFeedItemRepository>()(FeedItemRepository))
    .service("labelRepository", asClassArgs<ILabelRepository>()(LabelRepository))
    .service("notificationRepository", asClassArgs<INotificationRepository>()(NotificationRepository))
    // application(service)
    .service("jobScheduler", ["jobQueue"], asClassArgs<IJobScheduler>()(JobScheduler))
    .service("profileIndexer", ["profileRepository"], asClassArgs(ProfileIndexer))
    .service("postIndexer", ["postRepository", "feedItemRepository", "subscriptionRepository", "notificationRepository", "jobScheduler"], asClassArgs(PostIndexer))
    .service("indexActorService", ["actorRepository", "profileRepository", "jobScheduler"], asClassArgs(IndexActorService))
    .service("followIndexer", ["followRepository", "jobScheduler", "indexActorService", "subscriptionRepository", "notificationRepository"], asClassArgs(FollowIndexer))
    .service("generatorIndexer", ["generatorRepository"], asClassArgs(GeneratorIndexer))
    .service("listIndexer", ["listRepository"], asClassArgs(ListIndexer))
    .service("listItemIndexer", ["listItemRepository", "indexActorService"], asClassArgs(ListItemIndexer))
    .service("gateIndexer", asClassArgs(GateIndexer))
    .service("likeIndexer", ["likeRepository", "jobScheduler", "subscriptionRepository", "notificationRepository"], asClassArgs(LikeIndexer))
    .service("repostIndexer", ["repostRepository", "feedItemRepository", "postRepository", "jobScheduler", "subscriptionRepository", "notificationRepository"], asClassArgs(RepostIndexer))
    .service("indexRecordService", ["recordRepository", "indexActorService", "postIndexer", "profileIndexer", "followIndexer", "generatorIndexer", "likeIndexer", "repostIndexer", "listIndexer", "listItemIndexer", "gateIndexer"], asClassArgs(IndexRecordService))
    // application(use-case)
    .service("resolveDidUseCase", ["didResolver", "handleResolver", "actorRepository", "db"], asClassArgs(ResolveDidUseCase))
    .service("upsertIdentityUseCase", ["transactionManager", "indexActorService", "resolveDidUseCase"], asClassArgs(UpsertIdentityUseCase))
    .service("indexCommitUseCase", ["transactionManager", "indexRecordService", "recordRevRepository"], asClassArgs(IndexCommitUseCase))
    .service("fetchRecordUseCase", ["recordFetcher", "transactionManager", "indexRecordService"], asClassArgs(FetchRecordUseCase))
    .service("aggregatePostStatsUseCase", ["postStatsRepository", "jobQueue", "db"], asClassArgs(AggregatePostStatsUseCase))
    .service("aggregateActorStatsUseCase", ["actorStatsRepository", "actorRepository", "db"], asClassArgs(AggregateActorStatsUseCase))
    .service("indexLabelUseCase", ["labelRepository", "actorRepository", "db"], asClassArgs(IndexLabelUseCase))
    .service("syncTapRepoUseCase", ["tapClient", "subscriptionRepository", "followRepository", "labelFetcher", "indexLabelUseCase", "db"], asClassArgs(SyncTapRepoUseCase))
    .service("syncWorker", ["resolveDidUseCase", "fetchRecordUseCase", "aggregatePostStatsUseCase", "aggregateActorStatsUseCase", "syncTapRepoUseCase", "indexLabelUseCase", "redisUrl"], asClassArgs(SyncWorker))
    // presentation
    .service("healthRouter", ["nodeEnv", "logLevel", "port"], healthRouterFactory)
    .service("tapSubscriber", ["loggerManager", "metricReporter", "indexCommitUseCase", "upsertIdentityUseCase", "tapUrl", "tapConcurrency"], asClassArgs(TapSubscriber))
    .service("labelSubscriber", ["metricReporter", "jobQueue", "labelCursorStore", "moderationUrl"], asClassArgs(LabelSubscriber))
    .service("workerServer", ["loggerManager", "syncWorker", "tapSubscriber", "labelSubscriber", "jobQueue", "healthRouter", "port"], asClassArgs(WorkerServer));
