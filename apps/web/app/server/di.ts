import { createRegistry } from "@gyaku/di";

import { createPostUseCaseFactory } from "./application/post/create-post-use-case";
import { getTimelineUseCaseFactory } from "./application/timeline/get-timeline-use-case";
import { cookieSessionStorageFactory } from "./infrastructure/auth/cookie-session-storage";
import { oauthClientFactory } from "./infrastructure/auth/oauth-client";
import {
  sessionStoreFactory,
  stateStoreFactory,
} from "./infrastructure/auth/oauth-storage";
import { dbFactory } from "./infrastructure/db/db";
import { jobQueueFactory } from "./infrastructure/job-queue/job-queue";
import { loggerManagerFactory } from "./infrastructure/logger/logger";
import { postRepositoryFactory } from "./infrastructure/post/post-repository";
import { timelineRepositoryFactory } from "./infrastructure/timeline/timeline-repository";

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
  .service("timelineRepository", ["oauthClient"], timelineRepositoryFactory)
  .service("postRepository", ["oauthClient"], postRepositoryFactory)
  .service(
    "getTimelineUseCase",
    ["timelineRepository"],
    getTimelineUseCaseFactory,
  )
  .service("createPostUseCase", ["postRepository"], createPostUseCaseFactory)
  .resolve();
