import {
  databaseFactory,
  LoggerManager,
  TransactionManager,
} from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { SyncActorUseCase } from "./application/sync-actor-use-case.js";
import { SyncPostUseCase } from "./application/sync-post-use-case.js";
import { SyncProfileUseCase } from "./application/sync-profile-use-case.js";
import { ActorService } from "./domain/actor-service.js";
import { DidResolver } from "./infrastructure/atproto/did-resolver.js";
import { JetstreamIngester } from "./infrastructure/atproto/jetstream-ingester.js";
import { RedisDidCache } from "./infrastructure/atproto/redis-did-cache.js";
import { ActorRepository } from "./infrastructure/database/actor-repository.js";
import { PostRepository } from "./infrastructure/database/post-repository.js";
import { ProfileRepository } from "./infrastructure/database/profile-repository.js";
import { Metric } from "./infrastructure/system/metric.js";
import { IngesterServer } from "./presentation/server.js";
import { env } from "./shared/env.js";

createInjector()
  // infrastructure
  .provideValue("config", env)
  .provideClass("loggerManager", LoggerManager)
  .provideFactory("db", databaseFactory)
  .provideClass("transactionManager", TransactionManager)
  .provideClass("metric", Metric)
  .provideClass("didCache", RedisDidCache)
  .provideClass("didResolver", DidResolver)
  .provideClass("actorRepository", ActorRepository)
  .provideClass("profileRepository", ProfileRepository)
  .provideClass("postRepository", PostRepository)
  // domain
  .provideClass("actorService", ActorService)
  // application
  .provideClass("syncActorUseCase", SyncActorUseCase)
  .provideClass("syncProfileUseCase", SyncProfileUseCase)
  .provideClass("syncPostUseCase", SyncPostUseCase)
  .provideClass("ingester", JetstreamIngester)
  // presentation
  .injectClass(IngesterServer)
  .start();
