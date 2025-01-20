import {
  databaseFactory,
  LoggerManager,
  TransactionManager,
} from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { SyncActorUseCase } from "./application/sync-actor-use-case.js";
import { SyncProfileUseCase } from "./application/sync-profile-use-case.js";
import { DidResolver } from "./infrastructure/atproto/did-resolver.js";
import { JetstreamIngester } from "./infrastructure/atproto/jetstream-ingester.js";
import { ActorRepository } from "./infrastructure/database/actor-repository.js";
import { ProfileRepository } from "./infrastructure/database/profile-repository.js";
import { env } from "./shared/env.js";

createInjector()
  // infrastructure
  .provideValue("config", env)
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("db", databaseFactory)
  .provideClass("transactionManager", TransactionManager)
  .provideClass("actorRepository", ActorRepository)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("didResolver", DidResolver)
  // application
  .provideClass("syncActorUseCase", SyncActorUseCase)
  .provideClass("syncProfileUseCase", SyncProfileUseCase)
  // presentation
  .injectClass(JetstreamIngester)
  .start();
