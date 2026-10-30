import { createRegistry } from "@gyaku/di";

import { getLoginStepUseCaseFactory } from "./application/login/get-login-step-use-case";
import { oauthCallbackUseCaseFactory } from "./application/login/oauth-callback-use-case";
import { subscribeServerUseCaseFactory } from "./application/login/subscribe-server-use-case";
import { getMembersUseCaseFactory } from "./application/members/get-members-use-case";
import { getTrackedActorsUseCaseFactory } from "./application/members/get-tracked-actors-use-case";
import { cookieSessionStorageFactory } from "./infrastructure/auth/cookie-session-storage";
import { oauthClientFactory } from "./infrastructure/auth/oauth-client";
import {
  sessionStoreFactory,
  stateStoreFactory,
} from "./infrastructure/auth/oauth-storage";
import { dbFactory } from "./infrastructure/db/db";
import { jobQueueFactory } from "./infrastructure/job-queue/job-queue";
import { loggerManagerFactory } from "./infrastructure/logger/logger";
import { subscopeRepositoryFactory } from "./infrastructure/subscope/subscope-repository";

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
  .service("subscopeRepository", ["oauthClient"], subscopeRepositoryFactory)
  .service(
    "getLoginStepUseCase",
    ["subscopeRepository"],
    getLoginStepUseCaseFactory,
  )
  .service(
    "subscribeServerUseCase",
    ["subscopeRepository"],
    subscribeServerUseCaseFactory,
  )
  .service(
    "oauthCallbackUseCase",
    ["oauthClient", "subscopeRepository", "loggerManager"],
    oauthCallbackUseCaseFactory,
  )
  .service(
    "getMembersUseCase",
    ["subscopeRepository"],
    getMembersUseCaseFactory,
  )
  .service(
    "getTrackedActorsUseCase",
    ["subscopeRepository"],
    getTrackedActorsUseCaseFactory,
  )
  .resolve();
