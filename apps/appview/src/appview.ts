import { createInjector } from "typed-inject";

import { SyncProfileUseCase } from "./application/sync-profile.js";
import { SyncUserUseCase } from "./application/sync-user.js";
import { JetstreamIngester } from "./infrastructure/jetstream.js";
import { ProfileRepository } from "./infrastructure/repositories/profile.js";
import { UserRepository } from "./infrastructure/repositories/user.js";
import { AppviewServer } from "./presentation/server.js";
import { GetProfile } from "./presentation/xrpc/app/bsky/actor/getProfile.js";
import { XRPCRoutes } from "./presentation/xrpc/route.js";

createInjector()
  .provideClass("userRepository", UserRepository)
  .provideClass("syncUserUseCase", SyncUserUseCase)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("syncProfileUseCase", SyncProfileUseCase)
  .provideClass("ingester", JetstreamIngester)
  .provideClass("getProfile", GetProfile)
  .provideClass("xrpcRoutes", XRPCRoutes)
  .injectClass(AppviewServer)
  .start();
