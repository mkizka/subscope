import {
  databaseFactory,
  LoggerManager,
  TransactionManager,
} from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { SyncProfileUseCase } from "./application/sync-profile-use-case.js";
import { SyncUserUseCase } from "./application/sync-user-use-case.js";
import { DidResolver } from "./infrastructure/atproto/did-resolver.js";
import { JetstreamIngester } from "./infrastructure/atproto/jetstream-ingester.js";
import { ProfileRepository } from "./infrastructure/database/profile-repository.js";
import { UserRepository } from "./infrastructure/database/user-repository.js";
import { env } from "./shared/env.js";

createInjector()
  // infrastructure
  .provideValue("config", env)
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("db", databaseFactory)
  .provideClass("transactionManager", TransactionManager)
  .provideClass("userRepository", UserRepository)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("didResolver", DidResolver)
  // application
  .provideClass("syncUserUseCase", SyncUserUseCase)
  .provideClass("syncProfileUseCase", SyncProfileUseCase)
  // presentation
  .injectClass(JetstreamIngester)
  .start();
