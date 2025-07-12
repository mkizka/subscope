import {
  connectionPoolFactory,
  databaseFactory,
  DidResolver,
  JobQueue,
  LoggerManager,
  MetricReporter,
  RedisDidCache,
} from "@repo/common/infrastructure";
import { createInjector } from "typed-inject";

import { ActorLikesService } from "./application/service/feed/actor-likes-service.js";
import { AuthorFeedService } from "./application/service/feed/author-feed-service.js";
import { FeedProcessor } from "./application/service/feed/feed-processor.js";
import { TimelineService } from "./application/service/feed/timeline-service.js";
import { FollowService } from "./application/service/graph/follow-service.js";
import { AuthVerifierService } from "./application/service/request/auth-verifier-service.js";
import { HandleService } from "./application/service/request/handle-service.js";
import { PostSearchService } from "./application/service/search/post-search-service.js";
import { ProfileSearchService } from "./application/service/search/profile-search-service.js";
import { EmbedViewService } from "./application/service/view/embed-view-service.js";
import { LikeService } from "./application/service/view/like-service.js";
import { PostViewService } from "./application/service/view/post-view-service.js";
import { ProfileViewBuilder } from "./application/service/view/profile-view-builder.js";
import { ProfileViewService } from "./application/service/view/profile-view-service.js";
import { ReplyRefService } from "./application/service/view/reply-ref-service.js";
import { RepostService } from "./application/service/view/repost-service.js";
import { GetProfilesUseCase } from "./application/use-cases/actor/get-profiles-use-case.js";
import { SearchActorsTypeaheadUseCase } from "./application/use-cases/actor/search-actors-typeahead-use-case.js";
import { SearchActorsUseCase } from "./application/use-cases/actor/search-actors-use-case.js";
import { GetActorLikesUseCase } from "./application/use-cases/feed/get-actor-likes-use-case.js";
import { GetAuthorFeedUseCase } from "./application/use-cases/feed/get-author-feed-use-case.js";
import { GetLikesUseCase } from "./application/use-cases/feed/get-likes-use-case.js";
import { GetPostThreadUseCase } from "./application/use-cases/feed/get-post-thread-use-case.js";
import { GetPostsUseCase } from "./application/use-cases/feed/get-posts-use-case.js";
import { GetRepostedByUseCase } from "./application/use-cases/feed/get-reposted-by-use-case.js";
import { GetTimelineUseCase } from "./application/use-cases/feed/get-timeline-use-case.js";
import { SearchPostsUseCase } from "./application/use-cases/feed/search-posts-use-case.js";
import { GetFollowersUseCase } from "./application/use-cases/graph/get-followers-use-case.js";
import { GetFollowsUseCase } from "./application/use-cases/graph/get-follows-use-case.js";
import { GetJobStatusUseCase } from "./application/use-cases/job/get-job-status-use-case.js";
import { AtUriService } from "./domain/service/at-uri-service.js";
import { ActorStatsRepository } from "./infrastructure/actor-stats-repository.js";
import { AuthorFeedRepository } from "./infrastructure/author-feed-repository.js";
import { FollowRepository } from "./infrastructure/follow-repository.js";
import { HandleResolver } from "./infrastructure/handle-resolver.js";
import { LikeRepository } from "./infrastructure/like-repository.js";
import { PostRepository } from "./infrastructure/post-repository.js";
import { PostStatsRepository } from "./infrastructure/post-stats-repository.js";
import { ProfileRepository } from "./infrastructure/profile-repository.js";
import { RecordRepository } from "./infrastructure/record-repository.js";
import { RepostRepository } from "./infrastructure/repost-repository.js";
import { TimelineRepository } from "./infrastructure/timeline-repository.js";
import { TokenVerifier } from "./infrastructure/token-verifier.js";
import { GetProfile } from "./presentation/routes/app/bsky/actor/getProfile.js";
import { GetProfiles } from "./presentation/routes/app/bsky/actor/getProfiles.js";
import { SearchActors } from "./presentation/routes/app/bsky/actor/searchActors.js";
import { SearchActorsTypeahead } from "./presentation/routes/app/bsky/actor/searchActorsTypeahead.js";
import { GetActorLikes } from "./presentation/routes/app/bsky/feed/getActorLikes.js";
import { GetAuthorFeed } from "./presentation/routes/app/bsky/feed/getAuthorFeed.js";
import { GetLikes } from "./presentation/routes/app/bsky/feed/getLikes.js";
import { GetPosts } from "./presentation/routes/app/bsky/feed/getPosts.js";
import { GetPostThread } from "./presentation/routes/app/bsky/feed/getPostThread.js";
import { GetRepostedBy } from "./presentation/routes/app/bsky/feed/getRepostedBy.js";
import { GetTimeline } from "./presentation/routes/app/bsky/feed/getTimeline.js";
import { SearchPosts } from "./presentation/routes/app/bsky/feed/searchPosts.js";
import { GetFollowers } from "./presentation/routes/app/bsky/graph/getFollowers.js";
import { GetFollows } from "./presentation/routes/app/bsky/graph/getFollows.js";
import { GetJobStatus } from "./presentation/routes/dev/mkizka/test/getJobStatus.js";
import { XRPCRouter } from "./presentation/routes/xrpc.js";
import { AppviewServer } from "./presentation/server.js";
import { env } from "./shared/env.js";

createInjector()
  // envs
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("databaseUrl", env.DATABASE_URL)
  .provideValue("plcUrl", env.PLC_URL)
  .provideValue("redisUrl", env.REDIS_URL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("connectionPool", connectionPoolFactory)
  .provideFactory("db", databaseFactory)
  .provideClass("profileRepository", ProfileRepository)
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
  .provideClass("metricReporter", MetricReporter)
  .provideClass("didCache", RedisDidCache)
  .provideClass("didResolver", DidResolver)
  .provideClass("tokenVerifier", TokenVerifier)
  .provideClass("jobQueue", JobQueue)
  // application
  .provideClass("profileViewBuilder", ProfileViewBuilder)
  .provideClass("profileSearchService", ProfileSearchService)
  .provideClass("profileViewService", ProfileViewService)
  .provideClass("embedViewService", EmbedViewService)
  .provideClass("postViewService", PostViewService)
  .provideClass("replyRefService", ReplyRefService)
  .provideClass("timelineService", TimelineService)
  .provideClass("searchService", PostSearchService)
  .provideClass("authorFeedService", AuthorFeedService)
  .provideClass("actorLikesService", ActorLikesService)
  .provideClass("likeService", LikeService)
  .provideClass("repostService", RepostService)
  .provideClass("authVerifierService", AuthVerifierService)
  .provideClass("atUriService", AtUriService)
  .provideClass("handleService", HandleService)
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
  .provideClass("getJobStatusUseCase", GetJobStatusUseCase)
  .provideClass("getLikesUseCase", GetLikesUseCase)
  .provideClass("getRepostedByUseCase", GetRepostedByUseCase)
  .provideClass("getFollowsUseCase", GetFollowsUseCase)
  .provideClass("getFollowersUseCase", GetFollowersUseCase)
  // presentation
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
  .provideClass("getJobStatus", GetJobStatus)
  .provideClass("getLikes", GetLikes)
  .provideClass("getRepostedBy", GetRepostedBy)
  .provideClass("getFollows", GetFollows)
  .provideClass("getFollowers", GetFollowers)
  .provideClass("xrpcRouter", XRPCRouter)
  .injectClass(AppviewServer)
  .start();
