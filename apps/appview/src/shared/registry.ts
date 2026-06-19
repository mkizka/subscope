import { createRegistry } from "@gyaku/di";
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
import { ac } from "@repo/common/utils";

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
    .service("loggerManager", ["logLevel"], ac(LoggerManager))
    .service("metricReporter", ac(MetricReporter))
    .service("connectionPool", ["databaseUrl"], ({ databaseUrl }) => connectionPoolFactory(databaseUrl))
    .service("db", ["connectionPool", "loggerManager"], ({ connectionPool, loggerManager }) => databaseFactory(connectionPool, loggerManager))
    .service("transactionManager", ["db"], ac<ITransactionManager>(TransactionManager))
    .service("didCache", ["redisUrl", "metricReporter"], ac<IDidCache>(RedisDidCache))
    .service("didResolver", ["plcUrl", "loggerManager", "didCache", "metricReporter"], ac<IDidResolver>(DidResolver))
    .service("jobQueue", ["redisUrl"], ac<IJobQueue>(JobQueue))
    .service("profileRepository", ["db"], ac<IProfileRepository>(ProfileRepository))
    .service("actorRepository", ["db"], ac<IActorRepository>(ActorRepository))
    .service("actorStatsRepository", ["db"], ac<IActorStatsRepository>(ActorStatsRepository))
    .service("handleResolver", ["db"], ac<IHandleResolver>(HandleResolver))
    .service("recordRepository", ["db"], ac<IRecordRepository>(RecordRepository))
    .service("postRepository", ["db"], ac<IPostRepository>(PostRepository))
    .service("postStatsRepository", ["db"], ac<IPostStatsRepository>(PostStatsRepository))
    .service("timelineRepository", ["db"], ac<ITimelineRepository>(TimelineRepository))
    .service("authorFeedRepository", ["db"], ac<IAuthorFeedRepository>(AuthorFeedRepository))
    .service("likeRepository", ["db"], ac<ILikeRepository>(LikeRepository))
    .service("repostRepository", ["db"], ac<IRepostRepository>(RepostRepository))
    .service("followRepository", ["db"], ac<IFollowRepository>(FollowRepository))
    .service("generatorRepository", ["db"], ac<IGeneratorRepository>(GeneratorRepository))
    .service("inviteCodeRepository", ["db"], ac<IInviteCodeRepository>(InviteCodeRepository))
    .service("subscriptionRepository", ["db"], ac<ISubscriptionRepository>(SubscriptionRepository))
    .service("tokenVerifier", ["didResolver", "serviceDid"], ac<ITokenVerifier>(TokenVerifier))
    .service("assetUrlBuilder", ["blobProxyUrl"], ac<IAssetUrlBuilder>(AssetUrlBuilder))
    // application
    .service("jobScheduler", ["jobQueue"], ac<IJobScheduler>(JobScheduler))
    .service("createAdminService", ["actorRepository", "jobScheduler"], ac(CreateAdminService))
    .service("profileViewBuilder", ["assetUrlBuilder"], ac(ProfileViewBuilder))
    .service("profileSearchService", ["profileRepository"], ac(ProfileSearchService))
    .service("profileViewService", ["profileRepository", "actorStatsRepository", "followRepository", "profileViewBuilder"], ac(ProfileViewService))
    .service("inviteCodeService", ["inviteCodeRepository"], ac(InviteCodeService))
    .service("subscriptionService", ["subscriptionRepository"], ac(SubscriptionService))
    .service("generatorViewService", ["generatorRepository", "profileViewService", "assetUrlBuilder"], ac(GeneratorViewService))
    .service("postEmbedViewBuilder", ["assetUrlBuilder"], ac(PostEmbedViewBuilder))
    .service("postViewService", ["postRepository", "postStatsRepository", "recordRepository", "profileViewService", "generatorViewService", "postEmbedViewBuilder", "repostRepository", "likeRepository"], ac(PostViewService))
    .service("replyRefService", ["postViewService"], ac(ReplyRefService))
    .service("timelineService", ["timelineRepository"], ac(TimelineService))
    .service("searchService", ["postRepository"], ac(PostSearchService))
    .service("authorFeedService", ["authorFeedRepository"], ac(AuthorFeedService))
    .service("actorLikesService", ["likeRepository"], ac(ActorLikesService))
    .service("likeService", ["likeRepository"], ac(LikeService))
    .service("repostService", ["repostRepository"], ac(RepostService))
    .service("authVerifierMiddleware", ["tokenVerifier"], ac(AuthVerifierMiddleware))
    .service("adminMiddleware", ["authVerifierMiddleware", "actorRepository"], ac(AdminMiddleware))
    .service("atUriService", ["handleResolver"], ac(AtUriService))
    .service("handleMiddleware", ["handleResolver", "loggerManager"], ac(HandleMiddleware))
    .service("followService", ["followRepository"], ac(FollowService))
    .service("feedProcessor", ["postRepository", "repostRepository", "postViewService", "profileViewService", "replyRefService"], ac(FeedProcessor))
    // use-cases
    .service("getProfilesUseCase", ["profileViewService"], ac(GetProfilesUseCase))
    .service("searchActorsUseCase", ["profileSearchService", "profileViewService"], ac(SearchActorsUseCase))
    .service("searchActorsTypeaheadUseCase", ["profileSearchService", "profileViewService"], ac(SearchActorsTypeaheadUseCase))
    .service("getPostsUseCase", ["postViewService"], ac(GetPostsUseCase))
    .service("getPostThreadUseCase", ["postRepository", "postViewService"], ac(GetPostThreadUseCase))
    .service("getTimelineUseCase", ["timelineService", "feedProcessor"], ac(GetTimelineUseCase))
    .service("searchPostsUseCase", ["searchService", "postViewService"], ac(SearchPostsUseCase))
    .service("getActorLikesUseCase", ["actorLikesService", "feedProcessor"], ac(GetActorLikesUseCase))
    .service("getAuthorFeedUseCase", ["authorFeedService", "feedProcessor"], ac(GetAuthorFeedUseCase))
    .service("getFeedGeneratorsUseCase", ["generatorViewService"], ac(GetFeedGeneratorsUseCase))
    .service("getLikesUseCase", ["likeService", "profileViewService"], ac(GetLikesUseCase))
    .service("getRepostedByUseCase", ["repostService", "profileViewService"], ac(GetRepostedByUseCase))
    .service("getFollowsUseCase", ["followService", "profileViewService"], ac(GetFollowsUseCase))
    .service("getFollowersUseCase", ["followService", "profileViewService"], ac(GetFollowersUseCase))
    .service("createInviteCodeUseCase", ["db", "inviteCodeRepository", "publicUrl"], ac(CreateInviteCodeUseCase))
    .service("deleteInviteCodeUseCase", ["db", "inviteCodeRepository"], ac(DeleteInviteCodeUseCase))
    .service("getInviteCodesUseCase", ["inviteCodeService"], ac(GetInviteCodesUseCase))
    .service("getSubscribersUseCase", ["subscriptionService", "profileViewService"], ac(GetSubscribersUseCase))
    .service("registerAdminUseCase", ["transactionManager", "actorRepository", "subscriptionRepository", "createAdminService", "jobScheduler"], ac(RegisterAdminUseCase))
    .service("verifyAccessUseCase", ["actorRepository"], ac(VerifyAccessUseCase))
    .service("getSetupStatusUseCase", ["actorRepository"], ac(GetSetupStatusUseCase))
    .service("getSubscriptionStatusUseCase", ["subscriptionRepository"], ac(GetSubscriptionStatusUseCase))
    .service("subscribeServerUseCase", ["transactionManager", "actorRepository", "inviteCodeRepository", "subscriptionRepository", "jobScheduler"], ac(SubscribeServerUseCase))
    .service("unsubscribeServerUseCase", ["subscriptionRepository"], ac(UnsubscribeServerUseCase))
    // presentation
    .service("getPreferences", ac(GetPreferences))
    .service("getProfile", ["getProfilesUseCase", "handleMiddleware", "authVerifierMiddleware"], ac(GetProfile))
    .service("getProfiles", ["getProfilesUseCase", "handleMiddleware"], ac(GetProfiles))
    .service("searchActors", ["authVerifierMiddleware", "searchActorsUseCase"], ac(SearchActors))
    .service("searchActorsTypeahead", ["searchActorsTypeaheadUseCase"], ac(SearchActorsTypeahead))
    .service("getPosts", ["getPostsUseCase"], ac(GetPosts))
    .service("getPostThread", ["getPostThreadUseCase", "atUriService", "authVerifierMiddleware"], ac(GetPostThread))
    .service("getTimeline", ["authVerifierMiddleware", "getTimelineUseCase"], ac(GetTimeline))
    .service("searchPosts", ["searchPostsUseCase"], ac(SearchPosts))
    .service("getActorLikes", ["getActorLikesUseCase", "handleMiddleware", "authVerifierMiddleware"], ac(GetActorLikes))
    .service("getAuthorFeed", ["getAuthorFeedUseCase", "handleMiddleware", "authVerifierMiddleware"], ac(GetAuthorFeed))
    .service("getFeedGenerators", ["getFeedGeneratorsUseCase"], ac(GetFeedGenerators))
    .service("getLikes", ["getLikesUseCase"], ac(GetLikes))
    .service("getRepostedBy", ["getRepostedByUseCase", "db"], ac(GetRepostedBy))
    .service("getFollows", ["getFollowsUseCase", "handleMiddleware"], ac(GetFollows))
    .service("getFollowers", ["getFollowersUseCase", "handleMiddleware"], ac(GetFollowers))
    .service("createInviteCode", ["createInviteCodeUseCase", "adminMiddleware"], ac(CreateInviteCode))
    .service("deleteInviteCode", ["deleteInviteCodeUseCase", "adminMiddleware"], ac(DeleteInviteCode))
    .service("getInviteCodes", ["getInviteCodesUseCase", "adminMiddleware"], ac(GetInviteCodes))
    .service("getSubscribers", ["getSubscribersUseCase"], ac(GetSubscribers))
    .service("registerAdmin", ["registerAdminUseCase", "authVerifierMiddleware"], ac(RegisterAdmin))
    .service("verifyAccess", ["verifyAccessUseCase", "authVerifierMiddleware"], ac(VerifyAccess))
    .service("getSetupStatus", ["getSetupStatusUseCase"], ac(GetSetupStatus))
    .service("getSubscriptionStatus", ["getSubscriptionStatusUseCase"], ac(GetSubscriptionStatus))
    .service("subscribeServer", ["subscribeServerUseCase", "authVerifierMiddleware"], ac(SubscribeServer))
    .service("unsubscribeServer", ["unsubscribeServerUseCase"], ac(UnsubscribeServer))
    .service("xrpcRouter", ["getPreferences", "getProfile", "getProfiles", "searchActors", "searchActorsTypeahead", "getActorLikes", "getAuthorFeed", "getFeedGenerators", "getLikes", "getPosts", "getPostThread", "getRepostedBy", "getTimeline", "searchPosts", "getFollows", "getFollowers", "createInviteCode", "deleteInviteCode", "getInviteCodes", "getSubscribers", "registerAdmin", "verifyAccess", "getSetupStatus", "getSubscriptionStatus", "subscribeServer", "unsubscribeServer"], ({ getPreferences, getProfile, getProfiles, searchActors, searchActorsTypeahead, getActorLikes, getAuthorFeed, getFeedGenerators, getLikes, getPosts, getPostThread, getRepostedBy, getTimeline, searchPosts, getFollows, getFollowers, createInviteCode, deleteInviteCode, getInviteCodes, getSubscribers, registerAdmin, verifyAccess, getSetupStatus, getSubscriptionStatus, subscribeServer, unsubscribeServer, }) => xrpcRouterFactory(getPreferences, getProfile, getProfiles, searchActors, searchActorsTypeahead, getActorLikes, getAuthorFeed, getFeedGenerators, getLikes, getPosts, getPostThread, getRepostedBy, getTimeline, searchPosts, getFollows, getFollowers, createInviteCode, deleteInviteCode, getInviteCodes, getSubscribers, registerAdmin, verifyAccess, getSetupStatus, getSubscriptionStatus, subscribeServer, unsubscribeServer, ))
    .service("healthRouter", ["nodeEnv", "logLevel", "port", "publicUrl"], ({ nodeEnv, logLevel, port, publicUrl }) => healthRouterFactory({ NODE_ENV: nodeEnv, LOG_LEVEL: logLevel, PORT: port, PUBLIC_URL: publicUrl }))
    .service("wellKnownRouter", ["serviceDid", "publicUrl"], ({ serviceDid, publicUrl }) => wellKnownRouterFactory(serviceDid, publicUrl))
    // bootstrap
    .service("appViewServer", ["loggerManager", "xrpcRouter", "healthRouter", "wellKnownRouter", "port"], ac(AppViewServer));
