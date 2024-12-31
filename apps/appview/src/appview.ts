import { createInjector } from "typed-inject";

import { FindProfileDetailedUseCase } from "./application/find-profile-detailed-use-case.js";
import { SyncProfileUseCase } from "./application/sync-profile-use-case.js";
import { SyncUserUseCase } from "./application/sync-user-use-case.js";
import { DidResolver } from "./infrastructure/atproto/did-resolver.js";
import { JetstreamIngester } from "./infrastructure/atproto/jetstream-ingester.js";
import { ProfileRepository } from "./infrastructure/database/profile-repository.js";
import { TransactionManager } from "./infrastructure/database/transaction.js";
import { UserRepository } from "./infrastructure/database/user-repository.js";
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
  .provideClass("findProfileDetailedUseCase", FindProfileDetailedUseCase)
  .provideClass("getProfile", GetProfile)
  // presentation
  .provideClass("xrpcRoutes", XRPCRoutes)
  .injectClass(AppviewServer)
  .start();
