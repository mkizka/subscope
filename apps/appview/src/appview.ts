import { createInjector } from "typed-inject";

import { SyncProfileUseCase } from "./application/sync-profile.js";
import { SyncUserUseCase } from "./application/sync-user.js";
import { DidResolver } from "./infrastructure/atproto/did-resolver.js";
import { JetstreamIngester } from "./infrastructure/atproto/jetstream.js";
import { ProfileRepository } from "./infrastructure/database/profile.js";
import { TransactionManager } from "./infrastructure/database/transaction.js";
import { UserRepository } from "./infrastructure/database/user.js";
import { GetProfile } from "./presentation/routes/app/bsky/actor/getProfile.js";
import { XRPCRoutes } from "./presentation/routes/xrpc.js";
import { AppviewServer } from "./presentation/server.js";

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
