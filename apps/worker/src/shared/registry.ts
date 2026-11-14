import { asClassArgs, asFunctionArgs, createRegistry } from "@gyaku/di";
import {
  connectionPoolFactory,
  databaseFactory,
  DidResolver,
  JobQueue,
  JobScheduler,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
  TransactionManager,
} from "@repo/common/infrastructure";
import type {
  IDidCache,
  IDidResolver,
  IJobQueue,
  IJobScheduler,
  ITransactionManager,
} from "@repo/common/interface";

import type { IHandleResolver } from "../application/interfaces/external/handle-resolver.js";
import type { ILabelCursorStore } from "../application/interfaces/external/label-cursor-store.js";
import type { ILabelFetcher } from "../application/interfaces/external/label-fetcher.js";
import type { IRepoStatusFetcher } from "../application/interfaces/external/repo-status-fetcher.js";
import type { ITapClient } from "../application/interfaces/external/tap-client.js";
import type { IWebPushSender } from "../application/interfaces/external/web-push-sender.js";
import type { IAccountQuery } from "../application/interfaces/queries/account-query.js";
import type { IAccountStatsQuery } from "../application/interfaces/queries/account-stats-query.js";
import type { IPostQuery } from "../application/interfaces/queries/post-query.js";
import type { IPostStatsQuery } from "../application/interfaces/queries/post-stats-query.js";
import type { IProfileQuery } from "../application/interfaces/queries/profile-query.js";
import type { IPushNotificationQuery } from "../application/interfaces/queries/push-notification-query.js";
import type { IRegistrationQuery } from "../application/interfaces/queries/registration-query.js";
import type { IAccountRepository } from "../application/interfaces/repositories/account-repository.js";
import type { IAccountStatsRepository } from "../application/interfaces/repositories/account-stats-repository.js";
import type { IFeedItemRepository } from "../application/interfaces/repositories/feed-item-repository.js";
import type { IFollowRepository } from "../application/interfaces/repositories/follow-repository.js";
import type { IGeneratorRepository } from "../application/interfaces/repositories/generator-repository.js";
import type { ILabelRepository } from "../application/interfaces/repositories/label-repository.js";
import type { ILikeRepository } from "../application/interfaces/repositories/like-repository.js";
import type { IListItemRepository } from "../application/interfaces/repositories/list-item-repository.js";
import type { IListRepository } from "../application/interfaces/repositories/list-repository.js";
import type { INotificationRepository } from "../application/interfaces/repositories/notification-repository.js";
import type { IPostRepository } from "../application/interfaces/repositories/post-repository.js";
import type { IPostStatsRepository } from "../application/interfaces/repositories/post-stats-repository.js";
import type { IProfileRepository } from "../application/interfaces/repositories/profile-repository.js";
import type { IPushSubscriptionRepository } from "../application/interfaces/repositories/push-subscription-repository.js";
import type { IRecordRepository } from "../application/interfaces/repositories/record-repository.js";
import type { IRecordRevRepository } from "../application/interfaces/repositories/record-rev-repository.js";
import type { IRepostRepository } from "../application/interfaces/repositories/repost-repository.js";
import { IndexAccountService } from "../application/services/index-account-service.js";
import { IndexRecordService } from "../application/services/index-record-service.js";
import { FollowIndexer } from "../application/services/indexer/follow-indexer.js";
import { GateIndexer } from "../application/services/indexer/gate-indexer.js";
import { GeneratorIndexer } from "../application/services/indexer/generator-indexer.js";
import { LikeIndexer } from "../application/services/indexer/like-indexer.js";
import { LinkIndexer } from "../application/services/indexer/link-indexer.js";
import { ListIndexer } from "../application/services/indexer/list-indexer.js";
import { ListItemIndexer } from "../application/services/indexer/list-item-indexer.js";
import { PostIndexer } from "../application/services/indexer/post-indexer.js";
import { ProfileIndexer } from "../application/services/indexer/profile-indexer.js";
import { RepostIndexer } from "../application/services/indexer/repost-indexer.js";
import { NotificationService } from "../application/services/notification-service.js";
import { AggregateAccountStatsUseCase } from "../application/use-cases/async/aggregate-account-stats-use-case.js";
import { AggregatePostStatsUseCase } from "../application/use-cases/async/aggregate-post-stats-use-case.js";
import { CheckBackfillUseCase } from "../application/use-cases/async/check-backfill-use-case.js";
import { FetchRecordUseCase } from "../application/use-cases/async/fetch-record-use-case.js";
import { ResolveDidUseCase } from "../application/use-cases/async/resolve-did-use-case.js";
import { ScheduleBackfillChecksUseCase } from "../application/use-cases/async/schedule-backfill-checks-use-case.js";
import { SendPushNotificationUseCase } from "../application/use-cases/async/send-push-notification-use-case.js";
import { SyncTapRepoUseCase } from "../application/use-cases/async/sync-tap-repo-use-case.js";
import { IndexCommitUseCase } from "../application/use-cases/commit/index-commit-use-case.js";
import { UpsertIdentityUseCase } from "../application/use-cases/identity/upsert-identity-use-case.js";
import { IndexLabelUseCase } from "../application/use-cases/label/index-label-use-case.js";
import { LabelFetcher } from "../infrastructure/fetchers/label-fetcher.js";
import { RecordFetcher } from "../infrastructure/fetchers/record-fetcher.js";
import { HandleResolver } from "../infrastructure/handle-resolver/handle-resolver.js";
import { LabelCursorStore } from "../infrastructure/label-cursor-store/label-cursor-store.js";
import { AccountQuery } from "../infrastructure/queries/account-query/account-query.js";
import { AccountStatsQuery } from "../infrastructure/queries/account-stats-query/account-stats-query.js";
import { PostQuery } from "../infrastructure/queries/post-query/post-query.js";
import { PostStatsQuery } from "../infrastructure/queries/post-stats-query/post-stats-query.js";
import { ProfileQuery } from "../infrastructure/queries/profile-query/profile-query.js";
import { PushNotificationQuery } from "../infrastructure/queries/push-notification-query/push-notification-query.js";
import { RegistrationQuery } from "../infrastructure/queries/registration-query/registration-query.js";
import { RepoStatusFetcher } from "../infrastructure/repo-status-fetcher/repo-status-fetcher.js";
import { AccountRepository } from "../infrastructure/repositories/account-repository/account-repository.js";
import { AccountStatsRepository } from "../infrastructure/repositories/account-stats-repository/account-stats-repository.js";
import { FeedItemRepository } from "../infrastructure/repositories/feed-item-repository/feed-item-repository.js";
import { FollowRepository } from "../infrastructure/repositories/follow-repository/follow-repository.js";
import { GeneratorRepository } from "../infrastructure/repositories/generator-repository/generator-repository.js";
import { LabelRepository } from "../infrastructure/repositories/label-repository/label-repository.js";
import { LikeRepository } from "../infrastructure/repositories/like-repository/like-repository.js";
import { ListItemRepository } from "../infrastructure/repositories/list-item-repository/list-item-repository.js";
import { ListRepository } from "../infrastructure/repositories/list-repository/list-repository.js";
import { NotificationRepository } from "../infrastructure/repositories/notification-repository/notification-repository.js";
import { PostRepository } from "../infrastructure/repositories/post-repository/post-repository.js";
import { PostStatsRepository } from "../infrastructure/repositories/post-stats-repository/post-stats-repository.js";
import { ProfileRepository } from "../infrastructure/repositories/profile-repository/profile-repository.js";
import { PushSubscriptionRepository } from "../infrastructure/repositories/push-subscription-repository/push-subscription-repository.js";
import { RecordRepository } from "../infrastructure/repositories/record-repository/record-repository.js";
import { RecordRevRepository } from "../infrastructure/repositories/record-rev-repository/record-rev-repository.js";
import { RepostRepository } from "../infrastructure/repositories/repost-repository/repost-repository.js";
import { TapClient } from "../infrastructure/tap-client/tap-client.js";
import { WebPushSender } from "../infrastructure/web-push-sender/web-push-sender.js";
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
    .value("env", env)
    // infrastructure
    .service("loggerManager", ["env"], asClassArgs(LoggerManager))
    .service("tapClient", ["env"], asClassArgs<ITapClient>()(TapClient))
    .service("repoStatusFetcher", ["env"], asClassArgs<IRepoStatusFetcher>()(RepoStatusFetcher))
    .service("connectionPool", ["env"], connectionPoolFactory)
    .service("db", ["connectionPool", "loggerManager"], asFunctionArgs(databaseFactory))
    .service("transactionManager", ["db"], asClassArgs<ITransactionManager>()(TransactionManager))
    .service("metricReporter", asClassArgs(MetricReporter))
    .service("didCache", ["env", "metricReporter"], asClassArgs<IDidCache>()(RedisDidCache))
    .service("didResolver", ["env", "loggerManager", "didCache", "metricReporter"], asClassArgs<IDidResolver>()(DidResolver))
    .service("jobQueue", ["env"], asClassArgs<IJobQueue>()(JobQueue))
    .service("handleResolver", ["env"], asClassArgs<IHandleResolver>()(HandleResolver))
    .service("labelCursorStore", ["env"], asClassArgs<ILabelCursorStore>()(LabelCursorStore))
    .service("labelFetcher", ["env"], asClassArgs<ILabelFetcher>()(LabelFetcher))
    .service("recordFetcher", ["didResolver", "metricReporter"], asClassArgs(RecordFetcher))
    .service("accountStatsQuery", asClassArgs<IAccountStatsQuery>()(AccountStatsQuery))
    .service("postStatsQuery", asClassArgs<IPostStatsQuery>()(PostStatsQuery))
    .service("accountRepository", asClassArgs<IAccountRepository>()(AccountRepository))
    .service("accountStatsRepository", asClassArgs<IAccountStatsRepository>()(AccountStatsRepository))
    .service("profileRepository", asClassArgs<IProfileRepository>()(ProfileRepository))
    .service("postRepository", asClassArgs<IPostRepository>()(PostRepository))
    .service("accountQuery", asClassArgs<IAccountQuery>()(AccountQuery))
    .service("postQuery", asClassArgs<IPostQuery>()(PostQuery))
    .service("profileQuery", asClassArgs<IProfileQuery>()(ProfileQuery))
    .service("recordRepository", asClassArgs<IRecordRepository>()(RecordRepository))
    .service("recordRevRepository", asClassArgs<IRecordRevRepository>()(RecordRevRepository))
    .service("followRepository", asClassArgs<IFollowRepository>()(FollowRepository))
    .service("generatorRepository", asClassArgs<IGeneratorRepository>()(GeneratorRepository))
    .service("listRepository", asClassArgs<IListRepository>()(ListRepository))
    .service("listItemRepository", asClassArgs<IListItemRepository>()(ListItemRepository))
    .service("likeRepository", asClassArgs<ILikeRepository>()(LikeRepository))
    .service("postStatsRepository", asClassArgs<IPostStatsRepository>()(PostStatsRepository))
    .service("repostRepository", asClassArgs<IRepostRepository>()(RepostRepository))
    .service("registrationQuery", asClassArgs<IRegistrationQuery>()(RegistrationQuery))
    .service("feedItemRepository", asClassArgs<IFeedItemRepository>()(FeedItemRepository))
    .service("labelRepository", asClassArgs<ILabelRepository>()(LabelRepository))
    .service("notificationRepository", asClassArgs<INotificationRepository>()(NotificationRepository))
    .service("pushNotificationQuery", asClassArgs<IPushNotificationQuery>()(PushNotificationQuery))
    .service("pushSubscriptionRepository", asClassArgs<IPushSubscriptionRepository>()(PushSubscriptionRepository))
    .service("webPushSender", ["env"], asClassArgs<IWebPushSender>()(WebPushSender))
    // application(service)
    .service("jobScheduler", ["jobQueue"], asClassArgs<IJobScheduler>()(JobScheduler))
    .service("notificationService", ["notificationRepository", "jobScheduler"], asClassArgs(NotificationService))
    .service("profileIndexer", ["profileRepository"], asClassArgs(ProfileIndexer))
    .service("postIndexer", ["postRepository", "postQuery", "feedItemRepository", "registrationQuery", "notificationService", "jobScheduler"], asClassArgs(PostIndexer))
    .service("indexAccountService", ["accountRepository", "profileQuery", "jobScheduler"], asClassArgs(IndexAccountService))
    .service("followIndexer", ["followRepository", "jobScheduler", "indexAccountService", "registrationQuery", "notificationService"], asClassArgs(FollowIndexer))
    .service("generatorIndexer", ["generatorRepository"], asClassArgs(GeneratorIndexer))
    .service("listIndexer", ["listRepository"], asClassArgs(ListIndexer))
    .service("listItemIndexer", ["listItemRepository", "indexAccountService"], asClassArgs(ListItemIndexer))
    .service("gateIndexer", asClassArgs(GateIndexer))
    .service("linkIndexer", asClassArgs(LinkIndexer))
    .service("likeIndexer", ["likeRepository", "jobScheduler", "registrationQuery", "notificationService"], asClassArgs(LikeIndexer))
    .service("repostIndexer", ["repostRepository", "feedItemRepository", "postQuery", "jobScheduler", "registrationQuery", "notificationService"], asClassArgs(RepostIndexer))
    .service("indexRecordService", ["recordRepository", "indexAccountService", "postIndexer", "profileIndexer", "followIndexer", "generatorIndexer", "likeIndexer", "repostIndexer", "listIndexer", "listItemIndexer", "gateIndexer", "linkIndexer"], asClassArgs(IndexRecordService))
    // application(use-case)
    .service("resolveDidUseCase", ["didResolver", "handleResolver", "accountRepository", "transactionManager"], asClassArgs(ResolveDidUseCase))
    .service("upsertIdentityUseCase", ["transactionManager", "indexAccountService", "resolveDidUseCase"], asClassArgs(UpsertIdentityUseCase))
    .service("indexCommitUseCase", ["loggerManager", "transactionManager", "indexRecordService", "recordRevRepository"], asClassArgs(IndexCommitUseCase))
    .service("fetchRecordUseCase", ["recordFetcher", "transactionManager", "indexRecordService"], asClassArgs(FetchRecordUseCase))
    .service("aggregatePostStatsUseCase", ["postStatsQuery", "postStatsRepository", "jobQueue", "transactionManager"], asClassArgs(AggregatePostStatsUseCase))
    .service("aggregateAccountStatsUseCase", ["accountStatsQuery", "accountStatsRepository", "accountQuery", "transactionManager"], asClassArgs(AggregateAccountStatsUseCase))
    .service("indexLabelUseCase", ["labelRepository", "accountQuery", "transactionManager"], asClassArgs(IndexLabelUseCase))
    .service("syncTapRepoUseCase", ["tapClient", "registrationQuery", "labelFetcher", "indexLabelUseCase", "jobScheduler", "transactionManager"], asClassArgs(SyncTapRepoUseCase))
    .service("checkBackfillUseCase", ["tapClient", "repoStatusFetcher", "registrationQuery", "accountRepository", "jobScheduler", "transactionManager"], asClassArgs(CheckBackfillUseCase))
    .service("scheduleBackfillChecksUseCase", ["accountQuery", "jobScheduler", "transactionManager"], asClassArgs(ScheduleBackfillChecksUseCase))
    .service("sendPushNotificationUseCase", ["pushNotificationQuery", "pushSubscriptionRepository", "webPushSender", "transactionManager"], asClassArgs(SendPushNotificationUseCase))
    .service("syncWorker", ["resolveDidUseCase", "fetchRecordUseCase", "aggregatePostStatsUseCase", "aggregateAccountStatsUseCase", "syncTapRepoUseCase", "checkBackfillUseCase", "sendPushNotificationUseCase", "env"], asClassArgs(SyncWorker))
    // presentation
    .service("healthRouter", ["env"], healthRouterFactory)
    .service("tapSubscriber", ["loggerManager", "metricReporter", "indexCommitUseCase", "upsertIdentityUseCase", "env"], asClassArgs(TapSubscriber))
    .service("labelSubscriber", ["metricReporter", "indexLabelUseCase", "labelCursorStore", "env"], asClassArgs(LabelSubscriber))
    .service("workerServer", ["loggerManager", "syncWorker", "tapSubscriber", "labelSubscriber", "jobQueue", "scheduleBackfillChecksUseCase", "healthRouter", "env"], asClassArgs(WorkerServer));
