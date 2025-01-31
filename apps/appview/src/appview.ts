import { databaseFactory, LoggerManager } from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { FindProfilesDetailedUseCase } from "./application/find-profiles-detailed-use-case.js";
import { HandlesToDidsRepository } from "./infrastructure/handles-to-dids-repository.js";
import { ProfileRepository } from "./infrastructure/profile-repository.js";
import { GetProfile } from "./presentation/routes/app/bsky/actor/getProfile.js";
import { GetProfiles } from "./presentation/routes/app/bsky/actor/getProfiles.js";
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
  // application
  .provideClass("findProfilesDetailedUseCase", FindProfilesDetailedUseCase)
  .provideClass("getProfile", GetProfile)
  .provideClass("getProfiles", GetProfiles)
  // presentation
  .provideClass("xrpcRoutes", XRPCRoutes)
  .injectClass(AppviewServer)
  .start();
