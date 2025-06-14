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

import { GetJobStatusUseCase } from "./application/get-job-status-use-case.js";
import { GetPostThreadUseCase } from "./application/get-post-thread-use-case.js";
import { GetPostsUseCase } from "./application/get-posts-use-case.js";
import { GetProfilesUseCase } from "./application/get-profiles-use-case.js";
import { GetTimelineUseCase } from "./application/get-timeline-use-case.js";
import { AtUriService } from "./application/service/at-uri-service.js";
import { AuthVerifierService } from "./application/service/auth-verifier-service.js";
import { EmbedViewService } from "./application/service/embed-view-service.js";
import { PostViewService } from "./application/service/post-view-service.js";
import { ProfileViewService } from "./application/service/profile-view-service.js";
import { HandlesToDidsRepository } from "./infrastructure/handles-to-dids-repository.js";
import { PostRepository } from "./infrastructure/post-repository.js";
import { ProfileRepository } from "./infrastructure/profile-repository.js";
import { RecordRepository } from "./infrastructure/record-repository.js";
import { TokenVerifier } from "./infrastructure/token-verifier.js";
import { GetProfile } from "./presentation/routes/app/bsky/actor/getProfile.js";
import { GetProfiles } from "./presentation/routes/app/bsky/actor/getProfiles.js";
import { GetPosts } from "./presentation/routes/app/bsky/feed/getPosts.js";
import { GetPostThread } from "./presentation/routes/app/bsky/feed/getPostThread.js";
import { GetTimeline } from "./presentation/routes/app/bsky/feed/getTimeline.js";
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
  .provideClass("handlesToDidsRepository", HandlesToDidsRepository)
  .provideClass("recordRepository", RecordRepository)
  .provideClass("postRepository", PostRepository)
  .provideClass("metricReporter", MetricReporter)
  .provideClass("didCache", RedisDidCache)
  .provideClass("didResolver", DidResolver)
  .provideClass("tokenVerifier", TokenVerifier)
  .provideClass("jobQueue", JobQueue)
  // application
  .provideClass("profileViewService", ProfileViewService)
  .provideClass("embedViewService", EmbedViewService)
  .provideClass("postViewService", PostViewService)
  .provideClass("authVerifierService", AuthVerifierService)
  .provideClass("atUriService", AtUriService)
  .provideClass("getProfilesUseCase", GetProfilesUseCase)
  .provideClass("getPostsUseCase", GetPostsUseCase)
  .provideClass("getPostThreadUseCase", GetPostThreadUseCase)
  .provideClass("getTimelineUseCase", GetTimelineUseCase)
  .provideClass("getJobStatusUseCase", GetJobStatusUseCase)
  // presentation
  .provideClass("getProfile", GetProfile)
  .provideClass("getProfiles", GetProfiles)
  .provideClass("getPosts", GetPosts)
  .provideClass("getPostThread", GetPostThread)
  .provideClass("getTimeline", GetTimeline)
  .provideClass("getJobStatus", GetJobStatus)
  .provideClass("xrpcRouter", XRPCRouter)
  .injectClass(AppviewServer)
  .start();
