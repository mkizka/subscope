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
import { createInjector } from "typed-inject";

import { SubscopeServer } from "./bootstrap/server.js";
import { ImageProxyUseCase } from "./features/blob-proxy/application/image-proxy-use-case.js";
import { CacheCleanupScheduler } from "./features/blob-proxy/application/services/cache-cleanup-scheduler.js";
import { CacheCleanupService } from "./features/blob-proxy/application/services/cache-cleanup-service.js";
import { FetchBlobService } from "./features/blob-proxy/application/services/fetch-blob-service.js";
import { ImageCacheService } from "./features/blob-proxy/application/services/image-cache-service.js";
import { BlobFetcher } from "./features/blob-proxy/infrastructure/blob-fetcher.js";
import { CacheMetadataRepository } from "./features/blob-proxy/infrastructure/cache-metadata-repository.js";
import { CronTaskScheduler } from "./features/blob-proxy/infrastructure/cron-task-scheduler.js";
import { ImageDiskStorage } from "./features/blob-proxy/infrastructure/image-disk-storage.js";
import { ImageResizer } from "./features/blob-proxy/infrastructure/image-resizer.js";
import { imagesRouterFactory } from "./features/blob-proxy/presentation/images.js";
import { clientRouterFactory } from "./features/client/router.js";
import { oauthClientFactory } from "./features/oauth/client.js";
import { authMiddlewareFactory } from "./features/oauth/middleware.js";
import { oauthRouterFactory } from "./features/oauth/oauth.js";
import { OAuthSession } from "./features/oauth/session.js";
import { SessionStore, StateStore } from "./features/oauth/storage.js";
import { ProfileViewBuilder } from "./features/xrpc/application/service/actor/profile-view-builder.js";
import { ProfileViewService } from "./features/xrpc/application/service/actor/profile-view-service.js";
import { CreateAdminService } from "./features/xrpc/application/service/admin/create-admin-service.js";
import { InviteCodeService } from "./features/xrpc/application/service/admin/invite-code-service.js";
import { SubscriptionService } from "./features/xrpc/application/service/admin/subscription-service.js";
import { ActorLikesService } from "./features/xrpc/application/service/feed/actor-likes-service.js";
import { AuthorFeedService } from "./features/xrpc/application/service/feed/author-feed-service.js";
import { FeedProcessor } from "./features/xrpc/application/service/feed/feed-processor.js";
import { GeneratorViewService } from "./features/xrpc/application/service/feed/generator-view-service.js";
import { PostEmbedViewBuilder } from "./features/xrpc/application/service/feed/post-embed-view-builder.js";
import { PostViewService } from "./features/xrpc/application/service/feed/post-view-service.js";
import { ReplyRefService } from "./features/xrpc/application/service/feed/reply-ref-service.js";
import { RepostService } from "./features/xrpc/application/service/feed/repost-service.js";
import { TimelineService } from "./features/xrpc/application/service/feed/timeline-service.js";
import { FollowService } from "./features/xrpc/application/service/graph/follow-service.js";
import { LikeService } from "./features/xrpc/application/service/graph/like-service.js";
import { PostSearchService } from "./features/xrpc/application/service/search/post-search-service.js";
import { ProfileSearchService } from "./features/xrpc/application/service/search/profile-search-service.js";
import { GetProfilesUseCase } from "./features/xrpc/application/use-cases/actor/get-profiles-use-case.js";
import { SearchActorsTypeaheadUseCase } from "./features/xrpc/application/use-cases/actor/search-actors-typeahead-use-case.js";
import { SearchActorsUseCase } from "./features/xrpc/application/use-cases/actor/search-actors-use-case.js";
import { CreateInviteCodeUseCase } from "./features/xrpc/application/use-cases/admin/create-invite-code-use-case.js";
import { GetInviteCodesUseCase } from "./features/xrpc/application/use-cases/admin/get-invite-codes-use-case.js";
import { GetSubscribersUseCase } from "./features/xrpc/application/use-cases/admin/get-subscribers-use-case.js";
import { RegisterAdminUseCase } from "./features/xrpc/application/use-cases/admin/register-admin-use-case.js";
import { VerifyAccessUseCase } from "./features/xrpc/application/use-cases/admin/verify-access-use-case.js";
import { GetActorLikesUseCase } from "./features/xrpc/application/use-cases/feed/get-actor-likes-use-case.js";
import { GetAuthorFeedUseCase } from "./features/xrpc/application/use-cases/feed/get-author-feed-use-case.js";
import { GetFeedGeneratorsUseCase } from "./features/xrpc/application/use-cases/feed/get-feed-generators-use-case.js";
import { GetLikesUseCase } from "./features/xrpc/application/use-cases/feed/get-likes-use-case.js";
import { GetPostThreadUseCase } from "./features/xrpc/application/use-cases/feed/get-post-thread-use-case.js";
import { GetPostsUseCase } from "./features/xrpc/application/use-cases/feed/get-posts-use-case.js";
import { GetRepostedByUseCase } from "./features/xrpc/application/use-cases/feed/get-reposted-by-use-case.js";
import { GetTimelineUseCase } from "./features/xrpc/application/use-cases/feed/get-timeline-use-case.js";
import { SearchPostsUseCase } from "./features/xrpc/application/use-cases/feed/search-posts-use-case.js";
import { GetFollowersUseCase } from "./features/xrpc/application/use-cases/graph/get-followers-use-case.js";
import { GetFollowsUseCase } from "./features/xrpc/application/use-cases/graph/get-follows-use-case.js";
import { GetSubscriptionStatusUseCase } from "./features/xrpc/application/use-cases/sync/get-subscription-status-use-case.js";
import { SubscribeServerUseCase } from "./features/xrpc/application/use-cases/sync/subscribe-server-use-case.js";
import { UnsubscribeServerUseCase } from "./features/xrpc/application/use-cases/sync/unsubscribe-server-use-case.js";
import { AtUriService } from "./features/xrpc/domain/service/at-uri-service.js";
import { ActorRepository } from "./features/xrpc/infrastructure/actor-repository/actor-repository.js";
import { ActorStatsRepository } from "./features/xrpc/infrastructure/actor-stats-repository/actor-stats-repository.js";
import { AssetUrlBuilder } from "./features/xrpc/infrastructure/asset-url-builder/asset-url-builder.js";
import { AuthorFeedRepository } from "./features/xrpc/infrastructure/author-feed-repository/author-feed-repository.js";
import { FollowRepository } from "./features/xrpc/infrastructure/follow-repository/follow-repository.js";
import { GeneratorRepository } from "./features/xrpc/infrastructure/generator-repository/generator-repository.js";
import { HandleResolver } from "./features/xrpc/infrastructure/handle-resolver/handle-resolver.js";
import { InviteCodeRepository } from "./features/xrpc/infrastructure/invite-code-repository/invite-code-repository.js";
import { LikeRepository } from "./features/xrpc/infrastructure/like-repository/like-repository.js";
import { PostRepository } from "./features/xrpc/infrastructure/post-repository/post-repository.js";
import { PostStatsRepository } from "./features/xrpc/infrastructure/post-stats-repository/post-stats-repository.js";
import { ProfileRepository } from "./features/xrpc/infrastructure/profile-repository/profile-repository.js";
import { RecordRepository } from "./features/xrpc/infrastructure/record-repository/record-repository.js";
import { RepostRepository } from "./features/xrpc/infrastructure/repost-repository/repost-repository.js";
import { SubscriptionRepository } from "./features/xrpc/infrastructure/subscription-repository/subscription-repository.js";
import { TimelineRepository } from "./features/xrpc/infrastructure/timeline-repository/timeline-repository.js";
import { TokenVerifier } from "./features/xrpc/infrastructure/token-verifier/token-verifier.js";
import { AdminMiddleware } from "./features/xrpc/presentation/middleware/admin-middleware.js";
import { AuthVerifierMiddleware } from "./features/xrpc/presentation/middleware/auth-verifier-middleware.js";
import { HandleMiddleware } from "./features/xrpc/presentation/middleware/handle-middleware.js";
import { GetPreferences } from "./features/xrpc/presentation/routes/app/bsky/actor/getPreferences.js";
import { GetProfile } from "./features/xrpc/presentation/routes/app/bsky/actor/getProfile.js";
import { GetProfiles } from "./features/xrpc/presentation/routes/app/bsky/actor/getProfiles.js";
import { SearchActors } from "./features/xrpc/presentation/routes/app/bsky/actor/searchActors.js";
import { SearchActorsTypeahead } from "./features/xrpc/presentation/routes/app/bsky/actor/searchActorsTypeahead.js";
import { GetActorLikes } from "./features/xrpc/presentation/routes/app/bsky/feed/getActorLikes.js";
import { GetAuthorFeed } from "./features/xrpc/presentation/routes/app/bsky/feed/getAuthorFeed.js";
import { GetFeedGenerators } from "./features/xrpc/presentation/routes/app/bsky/feed/getFeedGenerators.js";
import { GetLikes } from "./features/xrpc/presentation/routes/app/bsky/feed/getLikes.js";
import { GetPosts } from "./features/xrpc/presentation/routes/app/bsky/feed/getPosts.js";
import { GetPostThread } from "./features/xrpc/presentation/routes/app/bsky/feed/getPostThread.js";
import { GetRepostedBy } from "./features/xrpc/presentation/routes/app/bsky/feed/getRepostedBy.js";
import { GetTimeline } from "./features/xrpc/presentation/routes/app/bsky/feed/getTimeline.js";
import { SearchPosts } from "./features/xrpc/presentation/routes/app/bsky/feed/searchPosts.js";
import { GetFollowers } from "./features/xrpc/presentation/routes/app/bsky/graph/getFollowers.js";
import { GetFollows } from "./features/xrpc/presentation/routes/app/bsky/graph/getFollows.js";
import { healthRouter } from "./features/xrpc/presentation/routes/health.js";
import { CreateInviteCode } from "./features/xrpc/presentation/routes/me/subsco/admin/createInviteCode.js";
import { GetInviteCodes } from "./features/xrpc/presentation/routes/me/subsco/admin/getInviteCodes.js";
import { GetSubscribers } from "./features/xrpc/presentation/routes/me/subsco/admin/getSubscribers.js";
import { RegisterAdmin } from "./features/xrpc/presentation/routes/me/subsco/admin/registerAdmin.js";
import { VerifyAccess } from "./features/xrpc/presentation/routes/me/subsco/admin/verifyAccess.js";
import { GetSubscriptionStatus } from "./features/xrpc/presentation/routes/me/subsco/sync/getSubscriptionStatus.js";
import { SubscribeServer } from "./features/xrpc/presentation/routes/me/subsco/sync/subscribeServer.js";
import { UnsubscribeServer } from "./features/xrpc/presentation/routes/me/subsco/sync/unsubscribeServer.js";
import { wellKnownRouter } from "./features/xrpc/presentation/routes/well-known.js";
import { xrpcRouterFactory } from "./features/xrpc/presentation/routes/xrpc.js";
import { env } from "./shared/env.js";

const server = createInjector()
  // envs
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("plcUrl", env.ATPROTO_PLC_URL)
  .provideValue("redisUrl", env.REDIS_URL)
  .provideValue("databaseUrl", env.DATABASE_URL)
  .provideValue("blobCacheDir", env.BLOB_CACHE_DIR)
  .provideValue("cacheCleanupCron", env.CACHE_CLEANUP_CRON)
  .provideValue("cacheCleanupTimezone", env.CACHE_CLEANUP_TIMEZONE)
  .provideValue("publicUrl", env.PUBLIC_URL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideClass("metricReporter", MetricReporter)
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory)
  .provideClass("transactionManager", TransactionManager)
  .provideClass("oauthStateStore", StateStore)
  .provideClass("oauthSessionStore", SessionStore)
  .provideFactory("oauthClient", oauthClientFactory)
  .provideClass("oauthSession", OAuthSession)
  .provideClass("didCache", RedisDidCache)
  .provideClass("didResolver", DidResolver)
  .provideClass("imageCacheStorage", ImageDiskStorage)
  .provideClass("cacheMetadataRepository", CacheMetadataRepository)
  .provideClass("blobFetcher", BlobFetcher)
  .provideClass("imageResizer", ImageResizer)
  .provideClass("taskScheduler", CronTaskScheduler)
  .provideClass("jobQueue", JobQueue)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("actorRepository", ActorRepository)
  .provideClass("actorStatsRepository", ActorStatsRepository)
  .provideClass("handleResolver", HandleResolver)
  .provideClass("recordRepository", RecordRepository)
  .provideClass("postRepository", PostRepository)
  .provideClass("postStatsRepository", PostStatsRepository)
  .provideClass("timelineRepository", TimelineRepository)
  .provideClass("authorFeedRepository", AuthorFeedRepository)
  .provideClass("likeRepository", LikeRepository)
  .provideClass("repostRepository", RepostRepository)
  .provideClass("followRepository", FollowRepository)
  .provideClass("generatorRepository", GeneratorRepository)
  .provideClass("inviteCodeRepository", InviteCodeRepository)
  .provideClass("subscriptionRepository", SubscriptionRepository)
  .provideClass("tokenVerifier", TokenVerifier)
  .provideClass("assetUrlBuilder", AssetUrlBuilder)
  // application
  .provideClass("fetchBlobService", FetchBlobService)
  .provideClass("imageCacheService", ImageCacheService)
  .provideClass("cacheCleanupService", CacheCleanupService)
  .provideClass("cacheCleanupScheduler", CacheCleanupScheduler)
  .provideClass("imageProxyUseCase", ImageProxyUseCase)
  .provideClass("jobScheduler", JobScheduler)
  .provideClass("createAdminService", CreateAdminService)
  .provideClass("profileViewBuilder", ProfileViewBuilder)
  .provideClass("profileSearchService", ProfileSearchService)
  .provideClass("profileViewService", ProfileViewService)
  .provideClass("inviteCodeService", InviteCodeService)
  .provideClass("subscriptionService", SubscriptionService)
  .provideClass("generatorViewService", GeneratorViewService)
  .provideClass("postEmbedViewBuilder", PostEmbedViewBuilder)
  .provideClass("postViewService", PostViewService)
  .provideClass("replyRefService", ReplyRefService)
  .provideClass("timelineService", TimelineService)
  .provideClass("searchService", PostSearchService)
  .provideClass("authorFeedService", AuthorFeedService)
  .provideClass("actorLikesService", ActorLikesService)
  .provideClass("likeService", LikeService)
  .provideClass("repostService", RepostService)
  .provideClass("authVerifierMiddleware", AuthVerifierMiddleware)
  .provideClass("adminMiddleware", AdminMiddleware)
  .provideClass("atUriService", AtUriService)
  .provideClass("handleMiddleware", HandleMiddleware)
  .provideClass("followService", FollowService)
  .provideClass("feedProcessor", FeedProcessor)
  .provideClass("getProfilesUseCase", GetProfilesUseCase)
  .provideClass("searchActorsUseCase", SearchActorsUseCase)
  .provideClass("searchActorsTypeaheadUseCase", SearchActorsTypeaheadUseCase)
  .provideClass("getPostsUseCase", GetPostsUseCase)
  .provideClass("getPostThreadUseCase", GetPostThreadUseCase)
  .provideClass("getTimelineUseCase", GetTimelineUseCase)
  .provideClass("searchPostsUseCase", SearchPostsUseCase)
  .provideClass("getActorLikesUseCase", GetActorLikesUseCase)
  .provideClass("getAuthorFeedUseCase", GetAuthorFeedUseCase)
  .provideClass("getFeedGeneratorsUseCase", GetFeedGeneratorsUseCase)
  .provideClass("getLikesUseCase", GetLikesUseCase)
  .provideClass("getRepostedByUseCase", GetRepostedByUseCase)
  .provideClass("getFollowsUseCase", GetFollowsUseCase)
  .provideClass("getFollowersUseCase", GetFollowersUseCase)
  .provideClass("createInviteCodeUseCase", CreateInviteCodeUseCase)
  .provideClass("getInviteCodesUseCase", GetInviteCodesUseCase)
  .provideClass("getSubscribersUseCase", GetSubscribersUseCase)
  .provideClass("registerAdminUseCase", RegisterAdminUseCase)
  .provideClass("verifyAccessUseCase", VerifyAccessUseCase)
  .provideClass("getSubscriptionStatusUseCase", GetSubscriptionStatusUseCase)
  .provideClass("subscribeServerUseCase", SubscribeServerUseCase)
  .provideClass("unsubscribeServerUseCase", UnsubscribeServerUseCase)
  // presentation
  .provideFactory("authMiddleware", authMiddlewareFactory)
  .provideFactory("oauthRouter", oauthRouterFactory)
  .provideFactory("blobProxyRouter", imagesRouterFactory)
  .provideFactory("clientRouter", clientRouterFactory)
  .provideClass("getPreferences", GetPreferences)
  .provideClass("getProfile", GetProfile)
  .provideClass("getProfiles", GetProfiles)
  .provideClass("searchActors", SearchActors)
  .provideClass("searchActorsTypeahead", SearchActorsTypeahead)
  .provideClass("getPosts", GetPosts)
  .provideClass("getPostThread", GetPostThread)
  .provideClass("getTimeline", GetTimeline)
  .provideClass("searchPosts", SearchPosts)
  .provideClass("getActorLikes", GetActorLikes)
  .provideClass("getAuthorFeed", GetAuthorFeed)
  .provideClass("getFeedGenerators", GetFeedGenerators)
  .provideClass("getLikes", GetLikes)
  .provideClass("getRepostedBy", GetRepostedBy)
  .provideClass("getFollows", GetFollows)
  .provideClass("getFollowers", GetFollowers)
  .provideClass("createInviteCode", CreateInviteCode)
  .provideClass("getInviteCodes", GetInviteCodes)
  .provideClass("getSubscribers", GetSubscribers)
  .provideClass("registerAdmin", RegisterAdmin)
  .provideClass("verifyAccess", VerifyAccess)
  .provideClass("getSubscriptionStatus", GetSubscriptionStatus)
  .provideClass("subscribeServer", SubscribeServer)
  .provideClass("unsubscribeServer", UnsubscribeServer)
  .provideFactory("xrpcRouter", xrpcRouterFactory)
  .provideValue("healthRouter", healthRouter)
  .provideValue("wellKnownRouter", wellKnownRouter)
  // bootstrap
  .injectClass(SubscopeServer);

await server.init();
server.start();
