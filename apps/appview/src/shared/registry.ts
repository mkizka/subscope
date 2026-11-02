import { asClassArgs, asFunctionArgs, createRegistry } from "@gyaku/di";
import type {
  IDidCache,
  IDidResolver,
  IJobQueue,
  IJobScheduler,
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
  TransactionManager,
} from "@repo/common/infrastructure";

import type { IActorQuery } from "../application/interfaces/actor-query.js";
import type { IActorRepository } from "../application/interfaces/actor-repository.js";
import type { IActorStatsQuery } from "../application/interfaces/actor-stats-query.js";
import type { IAssetUrlBuilder } from "../application/interfaces/asset-url-builder.js";
import type { IAuthorFeedQuery } from "../application/interfaces/author-feed-query.js";
import type { IBackfillStatusQuery } from "../application/interfaces/backfill-status-query.js";
import type { IFollowQuery } from "../application/interfaces/follow-query.js";
import type { IFollowRepository } from "../application/interfaces/follow-repository.js";
import type { IGeneratorQuery } from "../application/interfaces/generator-query.js";
import type { IHandleResolver } from "../application/interfaces/handle-resolver.js";
import type { IInviteCodeRepository } from "../application/interfaces/invite-code-repository.js";
import type { ILabelQuery } from "../application/interfaces/label-query.js";
import type { ILikeQuery } from "../application/interfaces/like-query.js";
import type { ILikeRepository } from "../application/interfaces/like-repository.js";
import type { IListItemQuery } from "../application/interfaces/list-item-query.js";
import type { IListQuery } from "../application/interfaces/list-query.js";
import type { INotificationQuery } from "../application/interfaces/notification-query.js";
import type { IPostQuery } from "../application/interfaces/post-query.js";
import type { IPostStatsQuery } from "../application/interfaces/post-stats-query.js";
import type { IProfileQuery } from "../application/interfaces/profile-query.js";
import type { IProfileRepository } from "../application/interfaces/profile-repository.js";
import type { IRecordQuery } from "../application/interfaces/record-query.js";
import type { IRepostQuery } from "../application/interfaces/repost-query.js";
import type { IRepostRepository } from "../application/interfaces/repost-repository.js";
import type { ISubscriptionRepository } from "../application/interfaces/subscription-repository.js";
import type { ITimelineQuery } from "../application/interfaces/timeline-query.js";
import type { ITokenVerifier } from "../application/interfaces/token-verifier.js";
import { CreateAdminService } from "../application/service/admin/create-admin-service.js";
import { InviteCodeService } from "../application/service/admin/invite-code-service.js";
import { SubscriptionService } from "../application/service/admin/subscription-service.js";
import { RepostService } from "../application/service/feed/repost-service.js";
import { FollowService } from "../application/service/graph/follow-service.js";
import { LikeService } from "../application/service/graph/like-service.js";
import { PostSearchService } from "../application/service/search/post-search-service.js";
import { ProfileSearchService } from "../application/service/search/profile-search-service.js";
import { GetProfileUseCase } from "../application/use-cases/actor/get-profile-use-case.js";
import { GetProfilesUseCase } from "../application/use-cases/actor/get-profiles-use-case.js";
import { SearchActorsTypeaheadUseCase } from "../application/use-cases/actor/search-actors-typeahead-use-case.js";
import { SearchActorsUseCase } from "../application/use-cases/actor/search-actors-use-case.js";
import { BanSubscriberUseCase } from "../application/use-cases/admin/ban-subscriber-use-case.js";
import { CreateInviteCodeUseCase } from "../application/use-cases/admin/create-invite-code-use-case.js";
import { DeleteInviteCodeUseCase } from "../application/use-cases/admin/delete-invite-code-use-case.js";
import { GetBannedActorsUseCase } from "../application/use-cases/admin/get-banned-actors-use-case.js";
import { GetInviteCodesUseCase } from "../application/use-cases/admin/get-invite-codes-use-case.js";
import { GetSubscribersUseCase } from "../application/use-cases/admin/get-subscribers-use-case.js";
import { GrantAdminUseCase } from "../application/use-cases/admin/grant-admin-use-case.js";
import { RegisterAdminUseCase } from "../application/use-cases/admin/register-admin-use-case.js";
import { UnbanActorUseCase } from "../application/use-cases/admin/unban-actor-use-case.js";
import { VerifyAccessUseCase } from "../application/use-cases/admin/verify-access-use-case.js";
import { GetActorLikesUseCase } from "../application/use-cases/feed/get-actor-likes-use-case.js";
import { GetAuthorFeedUseCase } from "../application/use-cases/feed/get-author-feed-use-case.js";
import { GetFeedGeneratorsUseCase } from "../application/use-cases/feed/get-feed-generators-use-case.js";
import { GetLikesUseCase } from "../application/use-cases/feed/get-likes-use-case.js";
import { GetListFeedUseCase } from "../application/use-cases/feed/get-list-feed-use-case.js";
import { GetPostThreadUseCase } from "../application/use-cases/feed/get-post-thread-use-case.js";
import { GetPostThreadV2UseCase } from "../application/use-cases/feed/get-post-thread-v2-use-case.js";
import { GetPostsUseCase } from "../application/use-cases/feed/get-posts-use-case.js";
import { GetRepostedByUseCase } from "../application/use-cases/feed/get-reposted-by-use-case.js";
import { GetTimelineUseCase } from "../application/use-cases/feed/get-timeline-use-case.js";
import { SearchPostsUseCase } from "../application/use-cases/feed/search-posts-use-case.js";
import { GetFollowersUseCase } from "../application/use-cases/graph/get-followers-use-case.js";
import { GetFollowsUseCase } from "../application/use-cases/graph/get-follows-use-case.js";
import { GetListUseCase } from "../application/use-cases/graph/get-list-use-case.js";
import { GetListsUseCase } from "../application/use-cases/graph/get-lists-use-case.js";
import { GetGroupedNotificationsUseCase } from "../application/use-cases/notification/get-grouped-notifications-use-case.js";
import { GetUnreadCountUseCase } from "../application/use-cases/notification/get-unread-count-use-case.js";
import { ListNotificationsUseCase } from "../application/use-cases/notification/list-notifications-use-case.js";
import { UpdateSeenUseCase } from "../application/use-cases/notification/update-seen-use-case.js";
import { GetMembersUseCase } from "../application/use-cases/server/get-members-use-case.js";
import { GetSetupStatusUseCase } from "../application/use-cases/server/get-setup-status-use-case.js";
import { GetTrackedActorsUseCase } from "../application/use-cases/server/get-tracked-actors-use-case.js";
import { GetSubscriptionStatusUseCase } from "../application/use-cases/sync/get-subscription-status-use-case.js";
import { SubscribeServerUseCase } from "../application/use-cases/sync/subscribe-server-use-case.js";
import { UnsubscribeServerUseCase } from "../application/use-cases/sync/unsubscribe-server-use-case.js";
import { EmbedViews } from "../application/views/embed-views.js";
import { FeedViews } from "../application/views/feed-views.js";
import { GeneratorViews } from "../application/views/generator-views.js";
import { ListViews } from "../application/views/list-views.js";
import { NotificationViews } from "../application/views/notification-views.js";
import { PostViews } from "../application/views/post-views.js";
import { ProfileViews } from "../application/views/profile-views.js";
import { ViewContextFactory } from "../application/views/view-context.js";
import { AtUriService } from "../domain/service/at-uri-service.js";
import { ActorQuery } from "../infrastructure/actor-query/actor-query.js";
import { ActorRepository } from "../infrastructure/actor-repository/actor-repository.js";
import { ActorStatsQuery } from "../infrastructure/actor-stats-query/actor-stats-query.js";
import { AssetUrlBuilder } from "../infrastructure/asset-url-builder/asset-url-builder.js";
import { AuthorFeedQuery } from "../infrastructure/author-feed-query/author-feed-query.js";
import { BackfillStatusQuery } from "../infrastructure/backfill-status-query/backfill-status-query.js";
import { FollowQuery } from "../infrastructure/follow-query/follow-query.js";
import { FollowRepository } from "../infrastructure/follow-repository/follow-repository.js";
import { GeneratorQuery } from "../infrastructure/generator-query/generator-query.js";
import { HandleResolver } from "../infrastructure/handle-resolver/handle-resolver.js";
import { InviteCodeRepository } from "../infrastructure/invite-code-repository/invite-code-repository.js";
import { LabelQuery } from "../infrastructure/label-query/label-query.js";
import { LikeQuery } from "../infrastructure/like-query/like-query.js";
import { LikeRepository } from "../infrastructure/like-repository/like-repository.js";
import { ListItemQuery } from "../infrastructure/list-item-query/list-item-query.js";
import { ListQuery } from "../infrastructure/list-query/list-query.js";
import { NotificationQuery } from "../infrastructure/notification-query/notification-query.js";
import { PostQuery } from "../infrastructure/post-query/post-query.js";
import { PostStatsQuery } from "../infrastructure/post-stats-query/post-stats-query.js";
import { ProfileQuery } from "../infrastructure/profile-query/profile-query.js";
import { ProfileRepository } from "../infrastructure/profile-repository/profile-repository.js";
import { RecordQuery } from "../infrastructure/record-query/record-query.js";
import { RepostQuery } from "../infrastructure/repost-query/repost-query.js";
import { RepostRepository } from "../infrastructure/repost-repository/repost-repository.js";
import { SubscriptionRepository } from "../infrastructure/subscription-repository/subscription-repository.js";
import { TimelineQuery } from "../infrastructure/timeline-query/timeline-query.js";
import { TokenVerifier } from "../infrastructure/token-verifier/token-verifier.js";
import { AdminMiddleware } from "../presentation/middleware/admin-middleware.js";
import { AuthVerifierMiddleware } from "../presentation/middleware/auth-verifier-middleware.js";
import { HandleMiddleware } from "../presentation/middleware/handle-middleware.js";
import { GetPreferences } from "../presentation/routes/app/bsky/actor/getPreferences.js";
import { GetProfile } from "../presentation/routes/app/bsky/actor/getProfile.js";
import { GetProfiles } from "../presentation/routes/app/bsky/actor/getProfiles.js";
import { SearchActors } from "../presentation/routes/app/bsky/actor/searchActors.js";
import { SearchActorsTypeahead } from "../presentation/routes/app/bsky/actor/searchActorsTypeahead.js";
import { GetActorLikes } from "../presentation/routes/app/bsky/feed/getActorLikes.js";
import { GetAuthorFeed } from "../presentation/routes/app/bsky/feed/getAuthorFeed.js";
import { GetFeedGenerators } from "../presentation/routes/app/bsky/feed/getFeedGenerators.js";
import { GetLikes } from "../presentation/routes/app/bsky/feed/getLikes.js";
import { GetListFeed } from "../presentation/routes/app/bsky/feed/getListFeed.js";
import { GetPosts } from "../presentation/routes/app/bsky/feed/getPosts.js";
import { GetPostThread } from "../presentation/routes/app/bsky/feed/getPostThread.js";
import { GetRepostedBy } from "../presentation/routes/app/bsky/feed/getRepostedBy.js";
import { GetTimeline } from "../presentation/routes/app/bsky/feed/getTimeline.js";
import { SearchPosts } from "../presentation/routes/app/bsky/feed/searchPosts.js";
import { SearchPostsV2 } from "../presentation/routes/app/bsky/feed/searchPostsV2.js";
import { GetFollowers } from "../presentation/routes/app/bsky/graph/getFollowers.js";
import { GetFollows } from "../presentation/routes/app/bsky/graph/getFollows.js";
import { GetList } from "../presentation/routes/app/bsky/graph/getList.js";
import { GetLists } from "../presentation/routes/app/bsky/graph/getLists.js";
import { GetGroupedNotifications } from "../presentation/routes/app/bsky/notification/getGroupedNotifications.js";
import { GetUnreadCount } from "../presentation/routes/app/bsky/notification/getUnreadCount.js";
import { ListNotifications } from "../presentation/routes/app/bsky/notification/listNotifications.js";
import { UpdateSeen } from "../presentation/routes/app/bsky/notification/updateSeen.js";
import { GetPostThreadV2 } from "../presentation/routes/app/bsky/unspecced/getPostThreadV2.js";
import { healthRouterFactory } from "../presentation/routes/health.js";
import { lexRouterFactory } from "../presentation/routes/lex.js";
import { BanSubscriber } from "../presentation/routes/me/subsco/admin/banSubscriber.js";
import { CreateInviteCode } from "../presentation/routes/me/subsco/admin/createInviteCode.js";
import { DeleteInviteCode } from "../presentation/routes/me/subsco/admin/deleteInviteCode.js";
import { GetBannedActors } from "../presentation/routes/me/subsco/admin/getBannedActors.js";
import { GetInviteCodes } from "../presentation/routes/me/subsco/admin/getInviteCodes.js";
import { GetSubscribers } from "../presentation/routes/me/subsco/admin/getSubscribers.js";
import { GrantAdmin } from "../presentation/routes/me/subsco/admin/grantAdmin.js";
import { RegisterAdmin } from "../presentation/routes/me/subsco/admin/registerAdmin.js";
import { UnbanActor } from "../presentation/routes/me/subsco/admin/unbanActor.js";
import { VerifyAccess } from "../presentation/routes/me/subsco/admin/verifyAccess.js";
import { GetMembers } from "../presentation/routes/me/subsco/server/getMembers.js";
import { GetSetupStatus } from "../presentation/routes/me/subsco/server/getSetupStatus.js";
import { GetTrackedActors } from "../presentation/routes/me/subsco/server/getTrackedActors.js";
import { GetSubscriptionStatus } from "../presentation/routes/me/subsco/sync/getSubscriptionStatus.js";
import { SubscribeServer } from "../presentation/routes/me/subsco/sync/subscribeServer.js";
import { UnsubscribeServer } from "../presentation/routes/me/subsco/sync/unsubscribeServer.js";
import { wellKnownRouterFactory } from "../presentation/routes/well-known.js";
import { AppViewServer } from "../presentation/server.js";
import type { Env } from "./env.js";

// prettier-ignore
export const createAppRegistry = (env: Env) =>
  createRegistry()
    // envs
    .value("logLevel", env.LOG_LEVEL)
    .value("plcUrl", env.PLC_URL)
    .value("redisUrl", env.REDIS_URL)
    .value("databaseUrl", env.DATABASE_URL)
    .value("publicUrl", env.PUBLIC_URL)
    .value("blobProxyUrl", env.BLOB_PROXY_URL)
    .value("serviceDid", env.SERVICE_DID)
    .value("port", env.PORT)
    .value("nodeEnv", env.NODE_ENV)
    // infrastructure
    .service("loggerManager", ["logLevel"], asClassArgs(LoggerManager))
    .service("metricReporter", asClassArgs(MetricReporter))
    .service("connectionPool", ["databaseUrl"], connectionPoolFactory)
    .service("db", ["connectionPool", "loggerManager"], asFunctionArgs(databaseFactory))
    .service("transactionManager", ["db"], asClassArgs<ITransactionManager>()(TransactionManager))
    .service("didCache", ["redisUrl", "metricReporter"], asClassArgs<IDidCache>()(RedisDidCache))
    .service("didResolver", ["plcUrl", "loggerManager", "didCache", "metricReporter"], asClassArgs<IDidResolver>()(DidResolver))
    .service("jobQueue", ["redisUrl"], asClassArgs<IJobQueue>()(JobQueue))
    .service("profileRepository", ["db"], asClassArgs<IProfileRepository>()(ProfileRepository))
    .service("backfillStatusQuery", ["db"], asClassArgs<IBackfillStatusQuery>()(BackfillStatusQuery))
    .service("profileQuery", ["db"], asClassArgs<IProfileQuery>()(ProfileQuery))
    .service("labelQuery", ["db"], asClassArgs<ILabelQuery>()(LabelQuery))
    .service("actorRepository", ["db"], asClassArgs<IActorRepository>()(ActorRepository))
    .service("actorQuery", ["db"], asClassArgs<IActorQuery>()(ActorQuery))
    .service("actorStatsQuery", ["db"], asClassArgs<IActorStatsQuery>()(ActorStatsQuery))
    .service("handleResolver", ["db"], asClassArgs<IHandleResolver>()(HandleResolver))
    .service("recordQuery", ["db"], asClassArgs<IRecordQuery>()(RecordQuery))
    .service("notificationQuery", ["db"], asClassArgs<INotificationQuery>()(NotificationQuery))
    .service("generatorQuery", ["db"], asClassArgs<IGeneratorQuery>()(GeneratorQuery))
    .service("likeQuery", ["db"], asClassArgs<ILikeQuery>()(LikeQuery))
    .service("postQuery", ["db"], asClassArgs<IPostQuery>()(PostQuery))
    .service("postStatsQuery", ["db"], asClassArgs<IPostStatsQuery>()(PostStatsQuery))
    .service("timelineQuery", ["db"], asClassArgs<ITimelineQuery>()(TimelineQuery))
    .service("authorFeedQuery", ["db"], asClassArgs<IAuthorFeedQuery>()(AuthorFeedQuery))
    .service("likeRepository", ["db"], asClassArgs<ILikeRepository>()(LikeRepository))
    .service("repostRepository", ["db"], asClassArgs<IRepostRepository>()(RepostRepository))
    .service("repostQuery", ["db"], asClassArgs<IRepostQuery>()(RepostQuery))
    .service("followRepository", ["db"], asClassArgs<IFollowRepository>()(FollowRepository))
    .service("followQuery", ["db"], asClassArgs<IFollowQuery>()(FollowQuery))
    .service("listItemQuery", ["db"], asClassArgs<IListItemQuery>()(ListItemQuery))
    .service("listQuery", ["db"], asClassArgs<IListQuery>()(ListQuery))
    .service("inviteCodeRepository", ["db"], asClassArgs<IInviteCodeRepository>()(InviteCodeRepository))
    .service("subscriptionRepository", ["db"], asClassArgs<ISubscriptionRepository>()(SubscriptionRepository))
    .service("tokenVerifier", ["didResolver", "serviceDid"], asClassArgs<ITokenVerifier>()(TokenVerifier))
    .service("assetUrlBuilder", ["blobProxyUrl"], asClassArgs<IAssetUrlBuilder>()(AssetUrlBuilder))
    // application
    .service("jobScheduler", ["jobQueue"], asClassArgs<IJobScheduler>()(JobScheduler))
    .service("createAdminService", ["actorRepository", "jobScheduler"], asClassArgs(CreateAdminService))
    .service("profileSearchService", ["profileRepository"], asClassArgs(ProfileSearchService))
    .service("inviteCodeService", ["inviteCodeRepository"], asClassArgs(InviteCodeService))
    .service("subscriptionService", ["subscriptionRepository"], asClassArgs(SubscriptionService))
    .service("searchService", ["postQuery"], asClassArgs(PostSearchService))
    .service("likeService", ["likeRepository"], asClassArgs(LikeService))
    .service("repostService", ["repostRepository"], asClassArgs(RepostService))
    .service("authVerifierMiddleware", ["tokenVerifier"], asClassArgs(AuthVerifierMiddleware))
    .service("adminMiddleware", ["authVerifierMiddleware", "actorRepository"], asClassArgs(AdminMiddleware))
    .service("atUriService", ["handleResolver"], asClassArgs(AtUriService))
    .service("handleMiddleware", ["handleResolver", "loggerManager"], asClassArgs(HandleMiddleware))
    .service("followService", ["followRepository"], asClassArgs(FollowService))
    .service("viewContextFactory", ["profileQuery", "labelQuery", "followQuery", "postQuery", "recordQuery", "postStatsQuery", "likeQuery", "repostQuery", "generatorQuery", "actorStatsQuery", "listQuery", "listItemQuery"], asClassArgs(ViewContextFactory))
    .service("profileViews", ["assetUrlBuilder"], asClassArgs(ProfileViews))
    .service("generatorViews", ["profileViews", "assetUrlBuilder"], asClassArgs(GeneratorViews))
    .service("embedViews", ["profileViews", "generatorViews", "assetUrlBuilder"], asClassArgs(EmbedViews))
    .service("listViews", ["profileViews", "assetUrlBuilder"], asClassArgs(ListViews))
    .service("postViews", ["profileViews", "embedViews", "listViews"], asClassArgs(PostViews))
    .service("feedViews", ["postViews", "profileViews"], asClassArgs(FeedViews))
    .service("notificationViews", ["profileViews", "postViews", "generatorViews"], asClassArgs(NotificationViews))
    // use-cases
    .service("getProfileUseCase", ["viewContextFactory", "profileViews"], asClassArgs(GetProfileUseCase))
    .service("getProfilesUseCase", ["viewContextFactory", "profileViews"], asClassArgs(GetProfilesUseCase))
    .service("searchActorsUseCase", ["profileSearchService", "viewContextFactory", "profileViews"], asClassArgs(SearchActorsUseCase))
    .service("searchActorsTypeaheadUseCase", ["profileSearchService", "viewContextFactory", "profileViews"], asClassArgs(SearchActorsTypeaheadUseCase))
    .service("getPostsUseCase", ["viewContextFactory", "postViews"], asClassArgs(GetPostsUseCase))
    .service("getPostThreadUseCase", ["postQuery", "viewContextFactory", "postViews"], asClassArgs(GetPostThreadUseCase))
    .service("getPostThreadV2UseCase", ["getPostThreadUseCase"], asClassArgs(GetPostThreadV2UseCase))
    .service("getTimelineUseCase", ["timelineQuery", "viewContextFactory", "feedViews"], asClassArgs(GetTimelineUseCase))
    .service("listNotificationsUseCase", ["notificationQuery", "subscriptionRepository", "viewContextFactory", "profileViews"], asClassArgs(ListNotificationsUseCase))
    .service("searchPostsUseCase", ["searchService", "viewContextFactory", "postViews"], asClassArgs(SearchPostsUseCase))
    .service("getActorLikesUseCase", ["likeQuery", "viewContextFactory", "feedViews"], asClassArgs(GetActorLikesUseCase))
    .service("getAuthorFeedUseCase", ["authorFeedQuery", "viewContextFactory", "feedViews"], asClassArgs(GetAuthorFeedUseCase))
    .service("getFeedGeneratorsUseCase", ["viewContextFactory", "generatorViews"], asClassArgs(GetFeedGeneratorsUseCase))
    .service("getLikesUseCase", ["likeService", "viewContextFactory", "profileViews"], asClassArgs(GetLikesUseCase))
    .service("getListFeedUseCase", ["timelineQuery", "viewContextFactory", "feedViews"], asClassArgs(GetListFeedUseCase))
    .service("getRepostedByUseCase", ["repostService", "viewContextFactory", "profileViews"], asClassArgs(GetRepostedByUseCase))
    .service("getFollowsUseCase", ["followService", "viewContextFactory", "profileViews"], asClassArgs(GetFollowsUseCase))
    .service("getFollowersUseCase", ["followService", "viewContextFactory", "profileViews"], asClassArgs(GetFollowersUseCase))
    .service("getListUseCase", ["listQuery", "viewContextFactory", "listViews", "profileViews"], asClassArgs(GetListUseCase))
    .service("getListsUseCase", ["listQuery", "viewContextFactory", "listViews"], asClassArgs(GetListsUseCase))
    .service("createInviteCodeUseCase", ["db", "inviteCodeRepository", "publicUrl"], asClassArgs(CreateInviteCodeUseCase))
    .service("deleteInviteCodeUseCase", ["db", "inviteCodeRepository"], asClassArgs(DeleteInviteCodeUseCase))
    .service("getBannedActorsUseCase", ["actorQuery", "viewContextFactory", "profileViews"], asClassArgs(GetBannedActorsUseCase))
    .service("getInviteCodesUseCase", ["inviteCodeService", "viewContextFactory", "profileViews"], asClassArgs(GetInviteCodesUseCase))
    .service("getSubscribersUseCase", ["subscriptionService", "viewContextFactory", "profileViews", "actorRepository", "subscriptionRepository", "backfillStatusQuery"], asClassArgs(GetSubscribersUseCase))
    .service("grantAdminUseCase", ["db", "actorRepository", "subscriptionRepository"], asClassArgs(GrantAdminUseCase))
    .service("registerAdminUseCase", ["transactionManager", "actorQuery", "subscriptionRepository", "createAdminService", "jobScheduler"], asClassArgs(RegisterAdminUseCase))
    .service("verifyAccessUseCase", ["actorRepository"], asClassArgs(VerifyAccessUseCase))
    .service("getMembersUseCase", ["subscriptionService", "actorRepository", "viewContextFactory", "profileViews"], asClassArgs(GetMembersUseCase))
    .service("getSetupStatusUseCase", ["actorQuery"], asClassArgs(GetSetupStatusUseCase))
    .service("getTrackedActorsUseCase", ["subscriptionRepository", "viewContextFactory", "profileViews"], asClassArgs(GetTrackedActorsUseCase))
    .service("getSubscriptionStatusUseCase", ["subscriptionRepository"], asClassArgs(GetSubscriptionStatusUseCase))
    .service("subscribeServerUseCase", ["transactionManager", "actorRepository", "inviteCodeRepository", "subscriptionRepository", "jobScheduler"], asClassArgs(SubscribeServerUseCase))
    .service("unsubscribeServerUseCase", ["subscriptionRepository", "followRepository", "jobScheduler"], asClassArgs(UnsubscribeServerUseCase))
    .service("unbanActorUseCase", ["db", "actorRepository"], asClassArgs(UnbanActorUseCase))
    .service("banSubscriberUseCase", ["transactionManager", "actorRepository", "unsubscribeServerUseCase"], asClassArgs(BanSubscriberUseCase))
    .service("updateSeenUseCase", ["subscriptionRepository"], asClassArgs(UpdateSeenUseCase))
    // presentation
    .service("getPreferences", asClassArgs(GetPreferences))
    .service("getProfile", ["getProfileUseCase", "handleMiddleware", "authVerifierMiddleware"], asClassArgs(GetProfile))
    .service("getProfiles", ["getProfilesUseCase", "handleMiddleware"], asClassArgs(GetProfiles))
    .service("searchActors", ["authVerifierMiddleware", "searchActorsUseCase"], asClassArgs(SearchActors))
    .service("searchActorsTypeahead", ["authVerifierMiddleware", "searchActorsTypeaheadUseCase"], asClassArgs(SearchActorsTypeahead))
    .service("getPosts", ["getPostsUseCase", "authVerifierMiddleware"], asClassArgs(GetPosts))
    .service("getPostThread", ["getPostThreadUseCase", "atUriService", "authVerifierMiddleware"], asClassArgs(GetPostThread))
    .service("getPostThreadV2", ["getPostThreadV2UseCase", "atUriService", "authVerifierMiddleware"], asClassArgs(GetPostThreadV2))
    .service("getTimeline", ["authVerifierMiddleware", "getTimelineUseCase"], asClassArgs(GetTimeline))
    .service("listNotifications", ["authVerifierMiddleware", "listNotificationsUseCase"], asClassArgs(ListNotifications))
    .service("getGroupedNotificationsUseCase", ["notificationQuery", "subscriptionRepository", "viewContextFactory", "notificationViews"], asClassArgs(GetGroupedNotificationsUseCase))
    .service("getGroupedNotifications", ["authVerifierMiddleware", "getGroupedNotificationsUseCase"], asClassArgs(GetGroupedNotifications))
    .service("getUnreadCountUseCase", ["notificationQuery"], asClassArgs(GetUnreadCountUseCase))
    .service("getUnreadCount", ["authVerifierMiddleware", "getUnreadCountUseCase"], asClassArgs(GetUnreadCount))
    .service("searchPosts", ["searchPostsUseCase"], asClassArgs(SearchPosts))
    .service("searchPostsV2", ["searchPostsUseCase"], asClassArgs(SearchPostsV2))
    .service("getActorLikes", ["getActorLikesUseCase", "handleMiddleware", "authVerifierMiddleware"], asClassArgs(GetActorLikes))
    .service("getAuthorFeed", ["getAuthorFeedUseCase", "handleMiddleware", "authVerifierMiddleware"], asClassArgs(GetAuthorFeed))
    .service("getFeedGenerators", ["getFeedGeneratorsUseCase"], asClassArgs(GetFeedGenerators))
    .service("getLikes", ["getLikesUseCase"], asClassArgs(GetLikes))
    .service("getListFeed", ["authVerifierMiddleware", "getListFeedUseCase"], asClassArgs(GetListFeed))
    .service("getRepostedBy", ["getRepostedByUseCase"], asClassArgs(GetRepostedBy))
    .service("getFollows", ["getFollowsUseCase", "handleMiddleware"], asClassArgs(GetFollows))
    .service("getFollowers", ["getFollowersUseCase", "handleMiddleware"], asClassArgs(GetFollowers))
    .service("getList", ["getListUseCase", "atUriService"], asClassArgs(GetList))
    .service("getLists", ["getListsUseCase", "handleMiddleware"], asClassArgs(GetLists))
    .service("createInviteCode", ["createInviteCodeUseCase", "adminMiddleware"], asClassArgs(CreateInviteCode))
    .service("deleteInviteCode", ["deleteInviteCodeUseCase", "adminMiddleware"], asClassArgs(DeleteInviteCode))
    .service("getInviteCodes", ["getInviteCodesUseCase", "adminMiddleware"], asClassArgs(GetInviteCodes))
    .service("getBannedActors", ["getBannedActorsUseCase", "adminMiddleware"], asClassArgs(GetBannedActors))
    .service("getSubscribers", ["getSubscribersUseCase", "adminMiddleware"], asClassArgs(GetSubscribers))
    .service("grantAdmin", ["grantAdminUseCase", "adminMiddleware"], asClassArgs(GrantAdmin))
    .service("registerAdmin", ["registerAdminUseCase", "authVerifierMiddleware"], asClassArgs(RegisterAdmin))
    .service("verifyAccess", ["verifyAccessUseCase", "authVerifierMiddleware"], asClassArgs(VerifyAccess))
    .service("getMembers", ["getMembersUseCase"], asClassArgs(GetMembers))
    .service("getSetupStatus", ["getSetupStatusUseCase"], asClassArgs(GetSetupStatus))
    .service("getTrackedActors", ["getTrackedActorsUseCase", "authVerifierMiddleware"], asClassArgs(GetTrackedActors))
    .service("getSubscriptionStatus", ["getSubscriptionStatusUseCase", "authVerifierMiddleware"], asClassArgs(GetSubscriptionStatus))
    .service("subscribeServer", ["subscribeServerUseCase", "authVerifierMiddleware"], asClassArgs(SubscribeServer))
    .service("unsubscribeServer", ["unsubscribeServerUseCase", "authVerifierMiddleware"], asClassArgs(UnsubscribeServer))
    .service("unbanActor", ["unbanActorUseCase", "adminMiddleware"], asClassArgs(UnbanActor))
    .service("banSubscriber", ["banSubscriberUseCase", "adminMiddleware"], asClassArgs(BanSubscriber))
    .service("updateSeen", ["updateSeenUseCase", "authVerifierMiddleware"], asClassArgs(UpdateSeen))
    .service("lexRouter", ["getPostThread", "searchPosts", "getActorLikes", "getAuthorFeed", "getTimeline", "getListFeed", "getFollows", "getFollowers", "getList", "getLists", "getUnreadCount", "listNotifications", "getGroupedNotifications", "updateSeen", "getSubscriptionStatus", "subscribeServer", "unsubscribeServer", "banSubscriber", "unbanActor", "createInviteCode", "deleteInviteCode", "getInviteCodes", "grantAdmin", "registerAdmin", "verifyAccess", "getMembers", "getSetupStatus", "getTrackedActors", "getPreferences", "getProfile", "getProfiles", "searchActors", "searchActorsTypeahead", "getSubscribers", "getBannedActors", "getLikes", "getRepostedBy", "getFeedGenerators", "getPosts", "getPostThreadV2", "searchPostsV2"], asFunctionArgs(lexRouterFactory))
    .service("healthRouter", ["nodeEnv", "logLevel", "port", "publicUrl"], healthRouterFactory)
    .service("wellKnownRouter", ["serviceDid", "publicUrl"], asFunctionArgs(wellKnownRouterFactory))
    // bootstrap
    .service("appViewServer", ["loggerManager", "lexRouter", "healthRouter", "wellKnownRouter", "port"], asClassArgs(AppViewServer));
