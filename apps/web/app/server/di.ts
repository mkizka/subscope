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
import { toggleFollowUseCaseFactory } from "./application/follow/toggle-follow-use-case";
import { getLoginStepUseCaseFactory } from "./application/login/get-login-step-use-case";
import { oauthCallbackUseCaseFactory } from "./application/login/oauth-callback-use-case";
import { subscribeServerUseCaseFactory } from "./application/login/subscribe-server-use-case";
import { getMembersUseCaseFactory } from "./application/members/get-members-use-case";
import { getTrackedActorsUseCaseFactory } from "./application/members/get-tracked-actors-use-case";
import { countUnreadNotificationsUseCaseFactory } from "./application/notification/count-unread-notifications-use-case";
import { getNotificationsUseCaseFactory } from "./application/notification/get-notifications-use-case";
import { markNotificationsSeenUseCaseFactory } from "./application/notification/mark-notifications-seen-use-case";
import { createPostUseCaseFactory } from "./application/post/create-post-use-case";
import { toggleReactionUseCaseFactory } from "./application/reaction/toggle-reaction-use-case";
import { getThreadUseCaseFactory } from "./application/thread/get-thread-use-case";
import { getTimelineUseCaseFactory } from "./application/timeline/get-timeline-use-case";
import { actorQueryFactory } from "./infrastructure/actor/actor-query";
import { adminCommandFactory } from "./infrastructure/admin/admin-command";
import { adminQueryFactory } from "./infrastructure/admin/admin-query";
import { cookieSessionStorageFactory } from "./infrastructure/auth/cookie-session-storage";
import { oauthClientFactory } from "./infrastructure/auth/oauth-client";
import {
  sessionStoreFactory,
  stateStoreFactory,
} from "./infrastructure/auth/oauth-storage";
import { dbFactory } from "./infrastructure/db/db";
import { followCommandFactory } from "./infrastructure/follow/follow-command";
import { jobQueueFactory } from "./infrastructure/job-queue/job-queue";
import { loggerManagerFactory } from "./infrastructure/logger/logger";
import { notificationCommandFactory } from "./infrastructure/notification/notification-command";
import { notificationQueryFactory } from "./infrastructure/notification/notification-query";
import { postRepositoryFactory } from "./infrastructure/post/post-repository";
import { reactionCommandFactory } from "./infrastructure/reaction/reaction-command";
import { subscopeCommandFactory } from "./infrastructure/subscope/subscope-command";
import { subscopeQueryFactory } from "./infrastructure/subscope/subscope-query";
import { threadQueryFactory } from "./infrastructure/thread/thread-query";
import { timelineQueryFactory } from "./infrastructure/timeline/timeline-query";

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
  .service("subscopeQuery", ["oauthClient"], subscopeQueryFactory)
  .service("subscopeCommand", ["oauthClient"], subscopeCommandFactory)
  .service("getLoginStepUseCase", ["subscopeQuery"], getLoginStepUseCaseFactory)
  .service(
    "subscribeServerUseCase",
    ["subscopeCommand"],
    subscribeServerUseCaseFactory,
  )
  .service(
    "oauthCallbackUseCase",
    ["oauthClient", "subscopeQuery", "subscopeCommand", "loggerManager"],
    oauthCallbackUseCaseFactory,
  )
  .service("getMembersUseCase", ["subscopeQuery"], getMembersUseCaseFactory)
  .service(
    "getTrackedActorsUseCase",
    ["subscopeQuery"],
    getTrackedActorsUseCaseFactory,
  )
  .service("notificationQuery", ["oauthClient"], notificationQueryFactory)
  .service("notificationCommand", ["oauthClient"], notificationCommandFactory)
  .service(
    "getNotificationsUseCase",
    ["notificationQuery"],
    getNotificationsUseCaseFactory,
  )
  .service(
    "countUnreadNotificationsUseCase",
    ["notificationQuery"],
    countUnreadNotificationsUseCaseFactory,
  )
  .service(
    "markNotificationsSeenUseCase",
    ["notificationCommand"],
    markNotificationsSeenUseCaseFactory,
  )
  .service("timelineQuery", ["oauthClient"], timelineQueryFactory)
  .service("postRepository", ["oauthClient"], postRepositoryFactory)
  .service("getTimelineUseCase", ["timelineQuery"], getTimelineUseCaseFactory)
  .service("createPostUseCase", ["postRepository"], createPostUseCaseFactory)
  .service("adminQuery", ["oauthClient"], adminQueryFactory)
  .service("adminCommand", ["oauthClient"], adminCommandFactory)
  .service(
    "getSubscribersUseCase",
    ["adminQuery"],
    getSubscribersUseCaseFactory,
  )
  .service(
    "banSubscriberUseCase",
    ["adminCommand"],
    banSubscriberUseCaseFactory,
  )
  .service("grantAdminUseCase", ["adminCommand"], grantAdminUseCaseFactory)
  .service(
    "getBannedActorsUseCase",
    ["adminQuery"],
    getBannedActorsUseCaseFactory,
  )
  .service("unbanActorUseCase", ["adminCommand"], unbanActorUseCaseFactory)
  .service(
    "getInviteCodesUseCase",
    ["adminQuery"],
    getInviteCodesUseCaseFactory,
  )
  .service(
    "createInviteCodeUseCase",
    ["adminCommand"],
    createInviteCodeUseCaseFactory,
  )
  .service(
    "deleteInviteCodeUseCase",
    ["adminCommand"],
    deleteInviteCodeUseCaseFactory,
  )
  .service("actorQuery", ["oauthClient"], actorQueryFactory)
  .service("getMeUseCase", ["actorQuery"], getMeUseCaseFactory)
  .service("getProfileUseCase", ["actorQuery"], getProfileUseCaseFactory)
  .service(
    "getProfilePageUseCase",
    ["actorQuery"],
    getProfilePageUseCaseFactory,
  )
  .service("followCommand", ["oauthClient"], followCommandFactory)
  .service("reactionCommand", ["oauthClient"], reactionCommandFactory)
  .service("toggleFollowUseCase", ["followCommand"], toggleFollowUseCaseFactory)
  .service(
    "toggleReactionUseCase",
    ["reactionCommand"],
    toggleReactionUseCaseFactory,
  )
  .service("threadQuery", ["oauthClient"], threadQueryFactory)
  .service("getThreadUseCase", ["threadQuery"], getThreadUseCaseFactory)
  .resolve();
