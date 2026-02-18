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

import { ImageProxyUseCase } from "@/server/features/blob-proxy/application/image-proxy-use-case.js";
import { CacheCleanupScheduler } from "@/server/features/blob-proxy/application/services/cache-cleanup-scheduler.js";
import { CacheCleanupService } from "@/server/features/blob-proxy/application/services/cache-cleanup-service.js";
import { FetchBlobService } from "@/server/features/blob-proxy/application/services/fetch-blob-service.js";
import { ImageCacheService } from "@/server/features/blob-proxy/application/services/image-cache-service.js";
import { BlobFetcher } from "@/server/features/blob-proxy/infrastructure/blob-fetcher.js";
import { CacheMetadataRepository } from "@/server/features/blob-proxy/infrastructure/cache-metadata-repository.js";
import { CronTaskScheduler } from "@/server/features/blob-proxy/infrastructure/cron-task-scheduler.js";
import { ImageDiskStorage } from "@/server/features/blob-proxy/infrastructure/image-disk-storage.js";
import { ImageResizer } from "@/server/features/blob-proxy/infrastructure/image-resizer.js";
import { imagesRouterFactory } from "@/server/features/blob-proxy/presentation/images.js";
import { clientRouterFactory } from "@/server/features/client/router.js";
import { oauthClientFactory } from "@/server/features/oauth/client.js";
import { authMiddlewareFactory } from "@/server/features/oauth/middleware.js";
import { oauthRouterFactory } from "@/server/features/oauth/oauth.js";
import { OAuthSession } from "@/server/features/oauth/session.js";
import { SessionStore, StateStore } from "@/server/features/oauth/storage.js";
import { ProfileViewBuilder } from "@/server/features/xrpc/application/service/actor/profile-view-builder.js";
import { ProfileViewService } from "@/server/features/xrpc/application/service/actor/profile-view-service.js";
import { CreateAdminService } from "@/server/features/xrpc/application/service/admin/create-admin-service.js";
import { InviteCodeService } from "@/server/features/xrpc/application/service/admin/invite-code-service.js";
import { SubscriptionService } from "@/server/features/xrpc/application/service/admin/subscription-service.js";
import { ActorLikesService } from "@/server/features/xrpc/application/service/feed/actor-likes-service.js";
import { AuthorFeedService } from "@/server/features/xrpc/application/service/feed/author-feed-service.js";
import { FeedProcessor } from "@/server/features/xrpc/application/service/feed/feed-processor.js";
import { GeneratorViewService } from "@/server/features/xrpc/application/service/feed/generator-view-service.js";
import { PostEmbedViewBuilder } from "@/server/features/xrpc/application/service/feed/post-embed-view-builder.js";
import { PostViewService } from "@/server/features/xrpc/application/service/feed/post-view-service.js";
import { ReplyRefService } from "@/server/features/xrpc/application/service/feed/reply-ref-service.js";
import { RepostService } from "@/server/features/xrpc/application/service/feed/repost-service.js";
import { TimelineService } from "@/server/features/xrpc/application/service/feed/timeline-service.js";
import { FollowService } from "@/server/features/xrpc/application/service/graph/follow-service.js";
import { LikeService } from "@/server/features/xrpc/application/service/graph/like-service.js";
import { PostSearchService } from "@/server/features/xrpc/application/service/search/post-search-service.js";
import { ProfileSearchService } from "@/server/features/xrpc/application/service/search/profile-search-service.js";
import { GetProfilesUseCase } from "@/server/features/xrpc/application/use-cases/actor/get-profiles-use-case.js";
import { SearchActorsTypeaheadUseCase } from "@/server/features/xrpc/application/use-cases/actor/search-actors-typeahead-use-case.js";
import { SearchActorsUseCase } from "@/server/features/xrpc/application/use-cases/actor/search-actors-use-case.js";
import { CreateInviteCodeUseCase } from "@/server/features/xrpc/application/use-cases/admin/create-invite-code-use-case.js";
import { DeleteInviteCodeUseCase } from "@/server/features/xrpc/application/use-cases/admin/delete-invite-code-use-case.js";
import { GetInviteCodesUseCase } from "@/server/features/xrpc/application/use-cases/admin/get-invite-codes-use-case.js";
import { GetSubscribersUseCase } from "@/server/features/xrpc/application/use-cases/admin/get-subscribers-use-case.js";
import { RegisterAdminUseCase } from "@/server/features/xrpc/application/use-cases/admin/register-admin-use-case.js";
import { VerifyAccessUseCase } from "@/server/features/xrpc/application/use-cases/admin/verify-access-use-case.js";
import { GetActorLikesUseCase } from "@/server/features/xrpc/application/use-cases/feed/get-actor-likes-use-case.js";
import { GetAuthorFeedUseCase } from "@/server/features/xrpc/application/use-cases/feed/get-author-feed-use-case.js";
import { GetFeedGeneratorsUseCase } from "@/server/features/xrpc/application/use-cases/feed/get-feed-generators-use-case.js";
import { GetLikesUseCase } from "@/server/features/xrpc/application/use-cases/feed/get-likes-use-case.js";
import { GetPostThreadUseCase } from "@/server/features/xrpc/application/use-cases/feed/get-post-thread-use-case.js";
import { GetPostsUseCase } from "@/server/features/xrpc/application/use-cases/feed/get-posts-use-case.js";
import { GetRepostedByUseCase } from "@/server/features/xrpc/application/use-cases/feed/get-reposted-by-use-case.js";
import { GetTimelineUseCase } from "@/server/features/xrpc/application/use-cases/feed/get-timeline-use-case.js";
import { SearchPostsUseCase } from "@/server/features/xrpc/application/use-cases/feed/search-posts-use-case.js";
import { GetFollowersUseCase } from "@/server/features/xrpc/application/use-cases/graph/get-followers-use-case.js";
import { GetFollowsUseCase } from "@/server/features/xrpc/application/use-cases/graph/get-follows-use-case.js";
import { GetSubscriptionStatusUseCase } from "@/server/features/xrpc/application/use-cases/sync/get-subscription-status-use-case.js";
import { SubscribeServerUseCase } from "@/server/features/xrpc/application/use-cases/sync/subscribe-server-use-case.js";
import { UnsubscribeServerUseCase } from "@/server/features/xrpc/application/use-cases/sync/unsubscribe-server-use-case.js";
import { AtUriService } from "@/server/features/xrpc/domain/service/at-uri-service.js";
import { ActorRepository } from "@/server/features/xrpc/infrastructure/actor-repository/actor-repository.js";
import { ActorStatsRepository } from "@/server/features/xrpc/infrastructure/actor-stats-repository/actor-stats-repository.js";
import { AssetUrlBuilder } from "@/server/features/xrpc/infrastructure/asset-url-builder/asset-url-builder.js";
import { AuthorFeedRepository } from "@/server/features/xrpc/infrastructure/author-feed-repository/author-feed-repository.js";
import { FollowRepository } from "@/server/features/xrpc/infrastructure/follow-repository/follow-repository.js";
import { GeneratorRepository } from "@/server/features/xrpc/infrastructure/generator-repository/generator-repository.js";
import { HandleResolver } from "@/server/features/xrpc/infrastructure/handle-resolver/handle-resolver.js";
import { InviteCodeRepository } from "@/server/features/xrpc/infrastructure/invite-code-repository/invite-code-repository.js";
import { LikeRepository } from "@/server/features/xrpc/infrastructure/like-repository/like-repository.js";
import { PostRepository } from "@/server/features/xrpc/infrastructure/post-repository/post-repository.js";
import { PostStatsRepository } from "@/server/features/xrpc/infrastructure/post-stats-repository/post-stats-repository.js";
import { ProfileRepository } from "@/server/features/xrpc/infrastructure/profile-repository/profile-repository.js";
import { RecordRepository } from "@/server/features/xrpc/infrastructure/record-repository/record-repository.js";
import { RepostRepository } from "@/server/features/xrpc/infrastructure/repost-repository/repost-repository.js";
import { SubscriptionRepository } from "@/server/features/xrpc/infrastructure/subscription-repository/subscription-repository.js";
import { TimelineRepository } from "@/server/features/xrpc/infrastructure/timeline-repository/timeline-repository.js";
import { TokenVerifier } from "@/server/features/xrpc/infrastructure/token-verifier/token-verifier.js";
import { AdminMiddleware } from "@/server/features/xrpc/presentation/middleware/admin-middleware.js";
import { AuthVerifierMiddleware } from "@/server/features/xrpc/presentation/middleware/auth-verifier-middleware.js";
import { HandleMiddleware } from "@/server/features/xrpc/presentation/middleware/handle-middleware.js";
import { GetPreferences } from "@/server/features/xrpc/presentation/routes/app/bsky/actor/getPreferences.js";
import { GetProfile } from "@/server/features/xrpc/presentation/routes/app/bsky/actor/getProfile.js";
import { GetProfiles } from "@/server/features/xrpc/presentation/routes/app/bsky/actor/getProfiles.js";
import { SearchActors } from "@/server/features/xrpc/presentation/routes/app/bsky/actor/searchActors.js";
import { SearchActorsTypeahead } from "@/server/features/xrpc/presentation/routes/app/bsky/actor/searchActorsTypeahead.js";
import { GetActorLikes } from "@/server/features/xrpc/presentation/routes/app/bsky/feed/getActorLikes.js";
import { GetAuthorFeed } from "@/server/features/xrpc/presentation/routes/app/bsky/feed/getAuthorFeed.js";
import { GetFeedGenerators } from "@/server/features/xrpc/presentation/routes/app/bsky/feed/getFeedGenerators.js";
import { GetLikes } from "@/server/features/xrpc/presentation/routes/app/bsky/feed/getLikes.js";
import { GetPosts } from "@/server/features/xrpc/presentation/routes/app/bsky/feed/getPosts.js";
import { GetPostThread } from "@/server/features/xrpc/presentation/routes/app/bsky/feed/getPostThread.js";
import { GetRepostedBy } from "@/server/features/xrpc/presentation/routes/app/bsky/feed/getRepostedBy.js";
import { GetTimeline } from "@/server/features/xrpc/presentation/routes/app/bsky/feed/getTimeline.js";
import { SearchPosts } from "@/server/features/xrpc/presentation/routes/app/bsky/feed/searchPosts.js";
import { GetFollowers } from "@/server/features/xrpc/presentation/routes/app/bsky/graph/getFollowers.js";
import { GetFollows } from "@/server/features/xrpc/presentation/routes/app/bsky/graph/getFollows.js";
import { healthRouter } from "@/server/features/xrpc/presentation/routes/health.js";
import { CreateInviteCode } from "@/server/features/xrpc/presentation/routes/me/subsco/admin/createInviteCode.js";
import { DeleteInviteCode } from "@/server/features/xrpc/presentation/routes/me/subsco/admin/deleteInviteCode.js";
import { GetInviteCodes } from "@/server/features/xrpc/presentation/routes/me/subsco/admin/getInviteCodes.js";
import { GetSubscribers } from "@/server/features/xrpc/presentation/routes/me/subsco/admin/getSubscribers.js";
import { RegisterAdmin } from "@/server/features/xrpc/presentation/routes/me/subsco/admin/registerAdmin.js";
import { VerifyAccess } from "@/server/features/xrpc/presentation/routes/me/subsco/admin/verifyAccess.js";
import { GetSubscriptionStatus } from "@/server/features/xrpc/presentation/routes/me/subsco/sync/getSubscriptionStatus.js";
import { SubscribeServer } from "@/server/features/xrpc/presentation/routes/me/subsco/sync/subscribeServer.js";
import { UnsubscribeServer } from "@/server/features/xrpc/presentation/routes/me/subsco/sync/unsubscribeServer.js";
import { wellKnownRouter } from "@/server/features/xrpc/presentation/routes/well-known.js";
import { xrpcRouterFactory } from "@/server/features/xrpc/presentation/routes/xrpc.js";
import { env } from "@/server/shared/env.js";

import { SubscopeServer } from "./subscope.js";

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
  .provideClass("deleteInviteCodeUseCase", DeleteInviteCodeUseCase)
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
  .provideClass("deleteInviteCode", DeleteInviteCode)
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

// 本番環境ではこのファイルがReact Routerのビルド成果物に含まれるため、
// NODE_ENV=production node build/server/index.jsでサーバーが起動する
if (env.NODE_ENV === "production") {
  server.start();
}

// 開発環境ではこのserverインスタンスを使用して開発用Expressを起動する
export { server };
