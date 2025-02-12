import { databaseFactory, LoggerManager } from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { GetPostsUseCase } from "./application/get-posts-use-case.js";
import { GetProfilesUseCase } from "./application/get-profiles-use-case.js";
import { GetTimelineUseCase } from "./application/get-timeline-use-case.js";
import { PostViewService } from "./application/service/post-view-service.js";
import { ProfileViewService } from "./application/service/profile-view-service.js";
import { HandlesToDidsRepository } from "./infrastructure/handles-to-dids-repository.js";
import { ProfileRepository } from "./infrastructure/profile-repository.js";
import { RecordRepository } from "./infrastructure/record-repository.js";
import { GetProfile } from "./presentation/routes/app/bsky/actor/getProfile.js";
import { GetProfiles } from "./presentation/routes/app/bsky/actor/getProfiles.js";
import { GetPosts } from "./presentation/routes/app/bsky/feed/getPosts.js";
import { GetTimeline } from "./presentation/routes/app/bsky/feed/getTimeline.js";
import { XRPCRoutes } from "./presentation/routes/xrpc.js";
import { AppviewServer } from "./presentation/server.js";
import { env } from "./shared/env.js";

createInjector()
  // envs
  .provideValue("logLevel", env.LOG_LEVEL)
  .provideValue("databaseUrl", env.DATABASE_URL)
  // infrastructure
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("db", databaseFactory)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("handlesToDidsRepository", HandlesToDidsRepository)
  .provideClass("recordRepository", RecordRepository)
  // application
  .provideClass("profileViewService", ProfileViewService)
  .provideClass("postViewService", PostViewService)
  .provideClass("getProfilesUseCase", GetProfilesUseCase)
  .provideClass("getPostsUseCase", GetPostsUseCase)
  .provideClass("getTimelineUseCase", GetTimelineUseCase)
  // presentation
  .provideClass("getProfile", GetProfile)
  .provideClass("getProfiles", GetProfiles)
  .provideClass("getPosts", GetPosts)
  .provideClass("getTimeline", GetTimeline)
  .provideClass("xrpcRoutes", XRPCRoutes)
  .injectClass(AppviewServer)
  .start();
