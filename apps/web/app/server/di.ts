import { createRegistry } from "@gyaku/di";

import { banSubscriberUseCaseFactory } from "./application/admin/ban-subscriber-use-case";
import { getBannedActorsUseCaseFactory } from "./application/admin/get-banned-actors-use-case";
import { getSubscribersUseCaseFactory } from "./application/admin/get-subscribers-use-case";
import { grantAdminUseCaseFactory } from "./application/admin/grant-admin-use-case";
import { unbanActorUseCaseFactory } from "./application/admin/unban-actor-use-case";
import { adminRepositoryFactory } from "./infrastructure/admin/admin-repository";
import { cookieSessionStorageFactory } from "./infrastructure/auth/cookie-session-storage";
import { oauthClientFactory } from "./infrastructure/auth/oauth-client";
import {
  sessionStoreFactory,
  stateStoreFactory,
} from "./infrastructure/auth/oauth-storage";
import { dbFactory } from "./infrastructure/db/db";
import { jobQueueFactory } from "./infrastructure/job-queue/job-queue";
import { loggerManagerFactory } from "./infrastructure/logger/logger";

export const di = await createRegistry()
  .service("loggerManager", loggerManagerFactory)
  .service("db", ["loggerManager"], dbFactory)
  .service("jobQueue", jobQueueFactory)
  .service("oauthStateStore", ["db"], stateStoreFactory)
  .service("oauthSessionStore", ["db"], sessionStoreFactory)
  .service(
    "oauthClient",
    ["oauthStateStore", "oauthSessionStore", "loggerManager"],
    oauthClientFactory,
  )
  .service("cookieSessionStorage", cookieSessionStorageFactory)
  .service("adminRepository", ["oauthClient"], adminRepositoryFactory)
  .service(
    "getSubscribersUseCase",
    ["adminRepository"],
    getSubscribersUseCaseFactory,
  )
  .service(
    "banSubscriberUseCase",
    ["adminRepository"],
    banSubscriberUseCaseFactory,
  )
  .service("grantAdminUseCase", ["adminRepository"], grantAdminUseCaseFactory)
  .service(
    "getBannedActorsUseCase",
    ["adminRepository"],
    getBannedActorsUseCaseFactory,
  )
  .service("unbanActorUseCase", ["adminRepository"], unbanActorUseCaseFactory)
  .resolve();
