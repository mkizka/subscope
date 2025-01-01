import { createInjector } from "typed-inject";

import { FindProfileDetailedUseCase } from "./application/find-profile-detailed-use-case.js";
import { ProfileRepository } from "./infrastructure/database/profile-repository.js";
import { UserRepository } from "./infrastructure/database/user-repository.js";
import { GetProfile } from "./presentation/routes/app/bsky/actor/getProfile.js";
import { XRPCRoutes } from "./presentation/routes/xrpc.js";
import { AppviewServer } from "./presentation/server.js";

createInjector()
  // infrastructure
  .provideClass("userRepository", UserRepository)
  .provideClass("profileRepository", ProfileRepository)
  // application
  .provideClass("findProfileDetailedUseCase", FindProfileDetailedUseCase)
  .provideClass("getProfile", GetProfile)
  // presentation
  .provideClass("xrpcRoutes", XRPCRoutes)
  .injectClass(AppviewServer)
  .start();
