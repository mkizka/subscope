import { createRegistry } from "@gyaku/di";

import { getMeUseCaseFactory } from "./application/actor/get-me-use-case";
import { getProfilePageUseCaseFactory } from "./application/actor/get-profile-page-use-case";
import { getProfileUseCaseFactory } from "./application/actor/get-profile-use-case";
import { banSubscriberUseCaseFactory } from "./application/admin/ban-subscriber-use-case";
import { createInviteCodeUseCaseFactory } from "./application/admin/create-invite-code-use-case";
import { deleteInviteCodeUseCaseFactory } from "./application/admin/delete-invite-code-use-case";
import { getBannedActorsUseCaseFactory } from "./application/admin/get-banned-actors-use-case";
import { getInviteCodesUseCaseFactory } from "./application/admin/get-invite-codes-use-case";
import { getSubscribersUseCaseFactory } from "./application/admin/get-subscribers-use-case";
import { grantAdminUseCaseFactory } from "./application/admin/grant-admin-use-case";
import { unbanActorUseCaseFactory } from "./application/admin/unban-actor-use-case";
import { countUnreadNotificationsUseCaseFactory } from "./application/notification/count-unread-notifications-use-case";
import { getNotificationsUseCaseFactory } from "./application/notification/get-notifications-use-case";
import { markNotificationsSeenUseCaseFactory } from "./application/notification/mark-notifications-seen-use-case";
import { createPostUseCaseFactory } from "./application/post/create-post-use-case";
import { getTimelineUseCaseFactory } from "./application/timeline/get-timeline-use-case";
import { actorRepositoryFactory } from "./infrastructure/actor/actor-repository";
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
import { notificationRepositoryFactory } from "./infrastructure/notification/notification-repository";
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
  .service("timelineRepository", ["oauthClient"], timelineRepositoryFactory)
  .service("postRepository", ["oauthClient"], postRepositoryFactory)
  .service(
    "getTimelineUseCase",
    ["timelineRepository"],
    getTimelineUseCaseFactory,
  )
  .service("createPostUseCase", ["postRepository"], createPostUseCaseFactory)
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
  .service(
    "getInviteCodesUseCase",
    ["adminRepository"],
    getInviteCodesUseCaseFactory,
  )
  .service(
    "createInviteCodeUseCase",
    ["adminRepository"],
    createInviteCodeUseCaseFactory,
  )
  .service(
    "deleteInviteCodeUseCase",
    ["adminRepository"],
    deleteInviteCodeUseCaseFactory,
  )
  .service("actorRepository", ["oauthClient"], actorRepositoryFactory)
  .service("getMeUseCase", ["actorRepository"], getMeUseCaseFactory)
  .service("getProfileUseCase", ["actorRepository"], getProfileUseCaseFactory)
  .service(
    "getProfilePageUseCase",
    ["actorRepository"],
    getProfilePageUseCaseFactory,
  )
  .resolve();
