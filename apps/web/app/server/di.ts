import { createRegistry } from "@gyaku/di";

import { toggleFollowUseCaseFactory } from "./application/follow/toggle-follow-use-case";
import { toggleReactionUseCaseFactory } from "./application/reaction/toggle-reaction-use-case";
import { cookieSessionStorageFactory } from "./infrastructure/auth/cookie-session-storage";
import { oauthClientFactory } from "./infrastructure/auth/oauth-client";
import {
  sessionStoreFactory,
  stateStoreFactory,
} from "./infrastructure/auth/oauth-storage";
import { dbFactory } from "./infrastructure/db/db";
import { followRepositoryFactory } from "./infrastructure/follow/follow-repository";
import { jobQueueFactory } from "./infrastructure/job-queue/job-queue";
import { loggerManagerFactory } from "./infrastructure/logger/logger";
import { reactionRepositoryFactory } from "./infrastructure/reaction/reaction-repository";

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
  .service("followRepository", ["oauthClient"], followRepositoryFactory)
  .service("reactionRepository", ["oauthClient"], reactionRepositoryFactory)
  .service(
    "toggleFollowUseCase",
    ["followRepository"],
    toggleFollowUseCaseFactory,
  )
  .service(
    "toggleReactionUseCase",
    ["reactionRepository"],
    toggleReactionUseCaseFactory,
  )
  .resolve();
