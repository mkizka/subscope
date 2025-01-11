import { createInjector } from "typed-inject";

import { FindProfilesDetailedUseCase } from "./application/find-profiles-detailed-use-case.js";
import { ProfileRepository } from "./infrastructure/profile-repository.js";
import { GetProfile } from "./presentation/routes/app/bsky/actor/getProfile.js";
import { XRPCRoutes } from "./presentation/routes/xrpc.js";
import { AppviewServer } from "./presentation/server.js";

createInjector()
  // infrastructure
  .provideClass("profileRepository", ProfileRepository)
  // application
  .provideClass("findProfilesDetailedUseCase", FindProfilesDetailedUseCase)
  .provideClass("getProfile", GetProfile)
  // presentation
  .provideClass("xrpcRoutes", XRPCRoutes)
  .injectClass(AppviewServer)
  .start();
