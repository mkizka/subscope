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

import type { IActorRepository } from "../application/interfaces/actor-repository.js";
import type { IActorStatsRepository } from "../application/interfaces/actor-stats-repository.js";
import type { IAssetUrlBuilder } from "../application/interfaces/asset-url-builder.js";
import type { IAuthorFeedRepository } from "../application/interfaces/author-feed-repository.js";
import type { IFollowRepository } from "../application/interfaces/follow-repository.js";
import type { IGeneratorRepository } from "../application/interfaces/generator-repository.js";
import type { IHandleResolver } from "../application/interfaces/handle-resolver.js";
import type { IInviteCodeRepository } from "../application/interfaces/invite-code-repository.js";
import type { ILikeRepository } from "../application/interfaces/like-repository.js";
import type { IPostRepository } from "../application/interfaces/post-repository.js";
import type { IPostStatsRepository } from "../application/interfaces/post-stats-repository.js";
import type { IProfileRepository } from "../application/interfaces/profile-repository.js";
import type { IRecordRepository } from "../application/interfaces/record-repository.js";
import type { IRepostRepository } from "../application/interfaces/repost-repository.js";
import type { ISubscriptionRepository } from "../application/interfaces/subscription-repository.js";
import type { ITimelineRepository } from "../application/interfaces/timeline-repository.js";
import type { ITokenVerifier } from "../application/interfaces/token-verifier.js";
import { ProfileViewBuilder } from "../application/service/actor/profile-view-builder.js";
import { ProfileViewService } from "../application/service/actor/profile-view-service.js";
import { CreateAdminService } from "../application/service/admin/create-admin-service.js";
import { InviteCodeService } from "../application/service/admin/invite-code-service.js";
import { SubscriptionService } from "../application/service/admin/subscription-service.js";
import { ActorLikesService } from "../application/service/feed/actor-likes-service.js";
import { AuthorFeedService } from "../application/service/feed/author-feed-service.js";
import { FeedProcessor } from "../application/service/feed/feed-processor.js";
import { GeneratorViewService } from "../application/service/feed/generator-view-service.js";
import { PostEmbedViewBuilder } from "../application/service/feed/post-embed-view-builder.js";
import { PostViewService } from "../application/service/feed/post-view-service.js";
import { ReplyRefService } from "../application/service/feed/reply-ref-service.js";
import { RepostService } from "../application/service/feed/repost-service.js";
import { TimelineService } from "../application/service/feed/timeline-service.js";
import { FollowService } from "../application/service/graph/follow-service.js";
import { LikeService } from "../application/service/graph/like-service.js";
import { PostSearchService } from "../application/service/search/post-search-service.js";
import { ProfileSearchService } from "../application/service/search/profile-search-service.js";
import { GetProfilesUseCase } from "../application/use-cases/actor/get-profiles-use-case.js";
import { SearchActorsTypeaheadUseCase } from "../application/use-cases/actor/search-actors-typeahead-use-case.js";
import { SearchActorsUseCase } from "../application/use-cases/actor/search-actors-use-case.js";
import { CreateInviteCodeUseCase } from "../application/use-cases/admin/create-invite-code-use-case.js";
import { DeleteInviteCodeUseCase } from "../application/use-cases/admin/delete-invite-code-use-case.js";
import { GetInviteCodesUseCase } from "../application/use-cases/admin/get-invite-codes-use-case.js";
import { GetSubscribersUseCase } from "../application/use-cases/admin/get-subscribers-use-case.js";
import { RegisterAdminUseCase } from "../application/use-cases/admin/register-admin-use-case.js";
import { VerifyAccessUseCase } from "../application/use-cases/admin/verify-access-use-case.js";
import { GetActorLikesUseCase } from "../application/use-cases/feed/get-actor-likes-use-case.js";
import { GetAuthorFeedUseCase } from "../application/use-cases/feed/get-author-feed-use-case.js";
import { GetFeedGeneratorsUseCase } from "../application/use-cases/feed/get-feed-generators-use-case.js";
import { GetLikesUseCase } from "../application/use-cases/feed/get-likes-use-case.js";
import { GetPostThreadUseCase } from "../application/use-cases/feed/get-post-thread-use-case.js";
import { GetPostsUseCase } from "../application/use-cases/feed/get-posts-use-case.js";
import { GetRepostedByUseCase } from "../application/use-cases/feed/get-reposted-by-use-case.js";
import { GetTimelineUseCase } from "../application/use-cases/feed/get-timeline-use-case.js";
import { SearchPostsUseCase } from "../application/use-cases/feed/search-posts-use-case.js";
import { GetFollowersUseCase } from "../application/use-cases/graph/get-followers-use-case.js";
import { GetFollowsUseCase } from "../application/use-cases/graph/get-follows-use-case.js";
import { GetSetupStatusUseCase } from "../application/use-cases/server/get-setup-status-use-case.js";
import { GetSubscriptionStatusUseCase } from "../application/use-cases/sync/get-subscription-status-use-case.js";
import { SubscribeServerUseCase } from "../application/use-cases/sync/subscribe-server-use-case.js";
import { UnsubscribeServerUseCase } from "../application/use-cases/sync/unsubscribe-server-use-case.js";
import { AtUriService } from "../domain/service/at-uri-service.js";
import { ActorRepository } from "../infrastructure/actor-repository/actor-repository.js";
import { ActorStatsRepository } from "../infrastructure/actor-stats-repository/actor-stats-repository.js";
import { AssetUrlBuilder } from "../infrastructure/asset-url-builder/asset-url-builder.js";
import { AuthorFeedRepository } from "../infrastructure/author-feed-repository/author-feed-repository.js";
import { FollowRepository } from "../infrastructure/follow-repository/follow-repository.js";
import { GeneratorRepository } from "../infrastructure/generator-repository/generator-repository.js";
import { HandleResolver } from "../infrastructure/handle-resolver/handle-resolver.js";
import { InviteCodeRepository } from "../infrastructure/invite-code-repository/invite-code-repository.js";
import { LikeRepository } from "../infrastructure/like-repository/like-repository.js";
import { PostRepository } from "../infrastructure/post-repository/post-repository.js";
import { PostStatsRepository } from "../infrastructure/post-stats-repository/post-stats-repository.js";
import { ProfileRepository } from "../infrastructure/profile-repository/profile-repository.js";
import { RecordRepository } from "../infrastructure/record-repository/record-repository.js";
import { RepostRepository } from "../infrastructure/repost-repository/repost-repository.js";
import { SubscriptionRepository } from "../infrastructure/subscription-repository/subscription-repository.js";
import { TimelineRepository } from "../infrastructure/timeline-repository/timeline-repository.js";
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
import { GetPosts } from "../presentation/routes/app/bsky/feed/getPosts.js";
import { GetPostThread } from "../presentation/routes/app/bsky/feed/getPostThread.js";
import { GetRepostedBy } from "../presentation/routes/app/bsky/feed/getRepostedBy.js";
import { GetTimeline } from "../presentation/routes/app/bsky/feed/getTimeline.js";
import { SearchPosts } from "../presentation/routes/app/bsky/feed/searchPosts.js";
import { GetFollowers } from "../presentation/routes/app/bsky/graph/getFollowers.js";
import { GetFollows } from "../presentation/routes/app/bsky/graph/getFollows.js";
import { healthRouterFactory } from "../presentation/routes/health.js";
import { CreateInviteCode } from "../presentation/routes/me/subsco/admin/createInviteCode.js";
import { DeleteInviteCode } from "../presentation/routes/me/subsco/admin/deleteInviteCode.js";
import { GetInviteCodes } from "../presentation/routes/me/subsco/admin/getInviteCodes.js";
import { GetSubscribers } from "../presentation/routes/me/subsco/admin/getSubscribers.js";
import { RegisterAdmin } from "../presentation/routes/me/subsco/admin/registerAdmin.js";
import { VerifyAccess } from "../presentation/routes/me/subsco/admin/verifyAccess.js";
import { GetSetupStatus } from "../presentation/routes/me/subsco/server/getSetupStatus.js";
import { GetSubscriptionStatus } from "../presentation/routes/me/subsco/sync/getSubscriptionStatus.js";
import { SubscribeServer } from "../presentation/routes/me/subsco/sync/subscribeServer.js";
import { UnsubscribeServer } from "../presentation/routes/me/subsco/sync/unsubscribeServer.js";
import { wellKnownRouterFactory } from "../presentation/routes/well-known.js";
import { xrpcRouterFactory } from "../presentation/routes/xrpc.js";
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
    .service("connectionPool", ["databaseUrl"], asFunctionArgs(connectionPoolFactory))
    .service("db", ["connectionPool", "loggerManager"], asFunctionArgs(databaseFactory))
    .service("transactionManager", ["db"], asClassArgs<ITransactionManager>()(TransactionManager))
    .service("didCache", ["redisUrl", "metricReporter"], asClassArgs<IDidCache>()(RedisDidCache))
    .service("didResolver", ["plcUrl", "loggerManager", "didCache", "metricReporter"], asClassArgs<IDidResolver>()(DidResolver))
    .service("jobQueue", ["redisUrl"], asClassArgs<IJobQueue>()(JobQueue))
    .service("profileRepository", ["db"], asClassArgs<IProfileRepository>()(ProfileRepository))
    .service("actorRepository", ["db"], asClassArgs<IActorRepository>()(ActorRepository))
    .service("actorStatsRepository", ["db"], asClassArgs<IActorStatsRepository>()(ActorStatsRepository))
    .service("handleResolver", ["db"], asClassArgs<IHandleResolver>()(HandleResolver))
    .service("recordRepository", ["db"], asClassArgs<IRecordRepository>()(RecordRepository))
    .service("postRepository", ["db"], asClassArgs<IPostRepository>()(PostRepository))
    .service("postStatsRepository", ["db"], asClassArgs<IPostStatsRepository>()(PostStatsRepository))
    .service("timelineRepository", ["db"], asClassArgs<ITimelineRepository>()(TimelineRepository))
    .service("authorFeedRepository", ["db"], asClassArgs<IAuthorFeedRepository>()(AuthorFeedRepository))
    .service("likeRepository", ["db"], asClassArgs<ILikeRepository>()(LikeRepository))
    .service("repostRepository", ["db"], asClassArgs<IRepostRepository>()(RepostRepository))
    .service("followRepository", ["db"], asClassArgs<IFollowRepository>()(FollowRepository))
    .service("generatorRepository", ["db"], asClassArgs<IGeneratorRepository>()(GeneratorRepository))
    .service("inviteCodeRepository", ["db"], asClassArgs<IInviteCodeRepository>()(InviteCodeRepository))
    .service("subscriptionRepository", ["db"], asClassArgs<ISubscriptionRepository>()(SubscriptionRepository))
    .service("tokenVerifier", ["didResolver", "serviceDid"], asClassArgs<ITokenVerifier>()(TokenVerifier))
    .service("assetUrlBuilder", ["blobProxyUrl"], asClassArgs<IAssetUrlBuilder>()(AssetUrlBuilder))
    // application
    .service("jobScheduler", ["jobQueue"], asClassArgs<IJobScheduler>()(JobScheduler))
    .service("createAdminService", ["actorRepository", "jobScheduler"], asClassArgs(CreateAdminService))
    .service("profileViewBuilder", ["assetUrlBuilder"], asClassArgs(ProfileViewBuilder))
    .service("profileSearchService", ["profileRepository"], asClassArgs(ProfileSearchService))
    .service("profileViewService", ["profileRepository", "actorStatsRepository", "followRepository", "profileViewBuilder"], asClassArgs(ProfileViewService))
    .service("inviteCodeService", ["inviteCodeRepository"], asClassArgs(InviteCodeService))
    .service("subscriptionService", ["subscriptionRepository"], asClassArgs(SubscriptionService))
    .service("generatorViewService", ["generatorRepository", "profileViewService", "assetUrlBuilder"], asClassArgs(GeneratorViewService))
    .service("postEmbedViewBuilder", ["assetUrlBuilder"], asClassArgs(PostEmbedViewBuilder))
    .service("postViewService", ["postRepository", "postStatsRepository", "recordRepository", "profileViewService", "generatorViewService", "postEmbedViewBuilder", "repostRepository", "likeRepository"], asClassArgs(PostViewService))
    .service("replyRefService", ["postViewService"], asClassArgs(ReplyRefService))
    .service("timelineService", ["timelineRepository"], asClassArgs(TimelineService))
    .service("searchService", ["postRepository"], asClassArgs(PostSearchService))
    .service("authorFeedService", ["authorFeedRepository"], asClassArgs(AuthorFeedService))
    .service("actorLikesService", ["likeRepository"], asClassArgs(ActorLikesService))
    .service("likeService", ["likeRepository"], asClassArgs(LikeService))
    .service("repostService", ["repostRepository"], asClassArgs(RepostService))
    .service("authVerifierMiddleware", ["tokenVerifier"], asClassArgs(AuthVerifierMiddleware))
    .service("adminMiddleware", ["authVerifierMiddleware", "actorRepository"], asClassArgs(AdminMiddleware))
    .service("atUriService", ["handleResolver"], asClassArgs(AtUriService))
    .service("handleMiddleware", ["handleResolver", "loggerManager"], asClassArgs(HandleMiddleware))
    .service("followService", ["followRepository"], asClassArgs(FollowService))
    .service("feedProcessor", ["postRepository", "repostRepository", "postViewService", "profileViewService", "replyRefService"], asClassArgs(FeedProcessor))
    // use-cases
    .service("getProfilesUseCase", ["profileViewService"], asClassArgs(GetProfilesUseCase))
    .service("searchActorsUseCase", ["profileSearchService", "profileViewService"], asClassArgs(SearchActorsUseCase))
    .service("searchActorsTypeaheadUseCase", ["profileSearchService", "profileViewService"], asClassArgs(SearchActorsTypeaheadUseCase))
    .service("getPostsUseCase", ["postViewService"], asClassArgs(GetPostsUseCase))
    .service("getPostThreadUseCase", ["postRepository", "postViewService"], asClassArgs(GetPostThreadUseCase))
    .service("getTimelineUseCase", ["timelineService", "feedProcessor"], asClassArgs(GetTimelineUseCase))
    .service("searchPostsUseCase", ["searchService", "postViewService"], asClassArgs(SearchPostsUseCase))
    .service("getActorLikesUseCase", ["actorLikesService", "feedProcessor"], asClassArgs(GetActorLikesUseCase))
    .service("getAuthorFeedUseCase", ["authorFeedService", "feedProcessor"], asClassArgs(GetAuthorFeedUseCase))
    .service("getFeedGeneratorsUseCase", ["generatorViewService"], asClassArgs(GetFeedGeneratorsUseCase))
    .service("getLikesUseCase", ["likeService", "profileViewService"], asClassArgs(GetLikesUseCase))
    .service("getRepostedByUseCase", ["repostService", "profileViewService"], asClassArgs(GetRepostedByUseCase))
    .service("getFollowsUseCase", ["followService", "profileViewService"], asClassArgs(GetFollowsUseCase))
    .service("getFollowersUseCase", ["followService", "profileViewService"], asClassArgs(GetFollowersUseCase))
    .service("createInviteCodeUseCase", ["db", "inviteCodeRepository", "publicUrl"], asClassArgs(CreateInviteCodeUseCase))
    .service("deleteInviteCodeUseCase", ["db", "inviteCodeRepository"], asClassArgs(DeleteInviteCodeUseCase))
    .service("getInviteCodesUseCase", ["inviteCodeService"], asClassArgs(GetInviteCodesUseCase))
    .service("getSubscribersUseCase", ["subscriptionService", "profileViewService"], asClassArgs(GetSubscribersUseCase))
    .service("registerAdminUseCase", ["transactionManager", "actorRepository", "subscriptionRepository", "createAdminService", "jobScheduler"], asClassArgs(RegisterAdminUseCase))
    .service("verifyAccessUseCase", ["actorRepository"], asClassArgs(VerifyAccessUseCase))
    .service("getSetupStatusUseCase", ["actorRepository"], asClassArgs(GetSetupStatusUseCase))
    .service("getSubscriptionStatusUseCase", ["subscriptionRepository"], asClassArgs(GetSubscriptionStatusUseCase))
    .service("subscribeServerUseCase", ["transactionManager", "actorRepository", "inviteCodeRepository", "subscriptionRepository", "jobScheduler"], asClassArgs(SubscribeServerUseCase))
    .service("unsubscribeServerUseCase", ["subscriptionRepository"], asClassArgs(UnsubscribeServerUseCase))
    // presentation
    .service("getPreferences", asClassArgs(GetPreferences))
    .service("getProfile", ["getProfilesUseCase", "handleMiddleware", "authVerifierMiddleware"], asClassArgs(GetProfile))
    .service("getProfiles", ["getProfilesUseCase", "handleMiddleware"], asClassArgs(GetProfiles))
    .service("searchActors", ["authVerifierMiddleware", "searchActorsUseCase"], asClassArgs(SearchActors))
    .service("searchActorsTypeahead", ["authVerifierMiddleware", "searchActorsTypeaheadUseCase"], asClassArgs(SearchActorsTypeahead))
    .service("getPosts", ["getPostsUseCase"], asClassArgs(GetPosts))
    .service("getPostThread", ["getPostThreadUseCase", "atUriService", "authVerifierMiddleware"], asClassArgs(GetPostThread))
    .service("getTimeline", ["authVerifierMiddleware", "getTimelineUseCase"], asClassArgs(GetTimeline))
    .service("searchPosts", ["searchPostsUseCase"], asClassArgs(SearchPosts))
    .service("getActorLikes", ["getActorLikesUseCase", "handleMiddleware", "authVerifierMiddleware"], asClassArgs(GetActorLikes))
    .service("getAuthorFeed", ["getAuthorFeedUseCase", "handleMiddleware", "authVerifierMiddleware"], asClassArgs(GetAuthorFeed))
    .service("getFeedGenerators", ["getFeedGeneratorsUseCase"], asClassArgs(GetFeedGenerators))
    .service("getLikes", ["getLikesUseCase"], asClassArgs(GetLikes))
    .service("getRepostedBy", ["getRepostedByUseCase"], asClassArgs(GetRepostedBy))
    .service("getFollows", ["getFollowsUseCase", "handleMiddleware"], asClassArgs(GetFollows))
    .service("getFollowers", ["getFollowersUseCase", "handleMiddleware"], asClassArgs(GetFollowers))
    .service("createInviteCode", ["createInviteCodeUseCase", "adminMiddleware"], asClassArgs(CreateInviteCode))
    .service("deleteInviteCode", ["deleteInviteCodeUseCase", "adminMiddleware"], asClassArgs(DeleteInviteCode))
    .service("getInviteCodes", ["getInviteCodesUseCase", "adminMiddleware"], asClassArgs(GetInviteCodes))
    .service("getSubscribers", ["getSubscribersUseCase"], asClassArgs(GetSubscribers))
    .service("registerAdmin", ["registerAdminUseCase", "authVerifierMiddleware"], asClassArgs(RegisterAdmin))
    .service("verifyAccess", ["verifyAccessUseCase", "authVerifierMiddleware"], asClassArgs(VerifyAccess))
    .service("getSetupStatus", ["getSetupStatusUseCase"], asClassArgs(GetSetupStatus))
    .service("getSubscriptionStatus", ["getSubscriptionStatusUseCase", "authVerifierMiddleware"], asClassArgs(GetSubscriptionStatus))
    .service("subscribeServer", ["subscribeServerUseCase", "authVerifierMiddleware"], asClassArgs(SubscribeServer))
    .service("unsubscribeServer", ["unsubscribeServerUseCase", "authVerifierMiddleware"], asClassArgs(UnsubscribeServer))
    .service("xrpcRouter", ["getPreferences", "getProfile", "getProfiles", "searchActors", "searchActorsTypeahead", "getActorLikes", "getAuthorFeed", "getFeedGenerators", "getLikes", "getPosts", "getPostThread", "getRepostedBy", "getTimeline", "searchPosts", "getFollows", "getFollowers", "createInviteCode", "deleteInviteCode", "getInviteCodes", "getSubscribers", "registerAdmin", "verifyAccess", "getSetupStatus", "getSubscriptionStatus", "subscribeServer", "unsubscribeServer"], asFunctionArgs(xrpcRouterFactory))
    .service("healthRouter", ["nodeEnv", "logLevel", "port", "publicUrl"], healthRouterFactory)
    .service("wellKnownRouter", ["serviceDid", "publicUrl"], asFunctionArgs(wellKnownRouterFactory))
    // bootstrap
    .service("appViewServer", ["loggerManager", "xrpcRouter", "healthRouter", "wellKnownRouter", "port"], asClassArgs(AppViewServer));
