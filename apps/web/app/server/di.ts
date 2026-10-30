import { createRegistry } from "@gyaku/di";

import { countUnreadNotificationsUseCaseFactory } from "./application/notification/count-unread-notifications-use-case";
import { getNotificationsUseCaseFactory } from "./application/notification/get-notifications-use-case";
import { markNotificationsSeenUseCaseFactory } from "./application/notification/mark-notifications-seen-use-case";
import { cookieSessionStorageFactory } from "./infrastructure/auth/cookie-session-storage";
import { oauthClientFactory } from "./infrastructure/auth/oauth-client";
import {
  sessionStoreFactory,
  stateStoreFactory,
} from "./infrastructure/auth/oauth-storage";
import { dbFactory } from "./infrastructure/db/db";
import { jobQueueFactory } from "./infrastructure/job-queue/job-queue";
import { loggerManagerFactory } from "./infrastructure/logger/logger";
import { notificationRepositoryFactory } from "./infrastructure/notification/notification-repository";

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
  .service(
    "notificationRepository",
    ["oauthClient"],
    notificationRepositoryFactory,
  )
  .service(
    "getNotificationsUseCase",
    ["notificationRepository"],
    getNotificationsUseCaseFactory,
  )
  .service(
    "countUnreadNotificationsUseCase",
    ["notificationRepository"],
    countUnreadNotificationsUseCaseFactory,
  )
  .service(
    "markNotificationsSeenUseCase",
    ["notificationRepository"],
    markNotificationsSeenUseCaseFactory,
  )
  .resolve();
