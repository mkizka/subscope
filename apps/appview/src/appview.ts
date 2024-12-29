import { createInjector } from "typed-inject";

import { SyncProfileUseCase } from "./application/sync-profile.js";
import { SyncUserUseCase } from "./application/sync-user.js";
import { JetstreamIngester } from "./infrastructure/jetstream.js";
import { DidResolver } from "./infrastructure/repositories/did-resolver.js";
import { ProfileRepository } from "./infrastructure/repositories/profile.js";
import { TransactionManager } from "./infrastructure/repositories/transaction.js";
import { UserRepository } from "./infrastructure/repositories/user.js";
import { AppviewServer } from "./presentation/server.js";
import { GetProfile } from "./presentation/xrpc/app/bsky/actor/getProfile.js";
import { XRPCRoutes } from "./presentation/xrpc/route.js";

createInjector()
  // infrastructure
  .provideClass("transactionManager", TransactionManager)
  .provideClass("userRepository", UserRepository)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("didResolver", DidResolver)
  // application
  .provideClass("syncUserUseCase", SyncUserUseCase)
  .provideClass("syncProfileUseCase", SyncProfileUseCase)
  .provideClass("ingester", JetstreamIngester)
  .provideClass("getProfile", GetProfile)
  // presentation
  .provideClass("xrpcRoutes", XRPCRoutes)
  .injectClass(AppviewServer)
  .start();
