import { createRegistry } from "@gyaku/di";

import { getFollowListUseCaseFactory } from "./application/accounts/get-follow-list-use-case";
import { getFollowedAccountsUseCaseFactory } from "./application/accounts/get-followed-accounts-use-case";
import { getMeUseCaseFactory } from "./application/accounts/get-me-use-case";
import { getProfilePageUseCaseFactory } from "./application/accounts/get-profile-page-use-case";
import { getProfileUseCaseFactory } from "./application/accounts/get-profile-use-case";
import { getServerMembersUseCaseFactory } from "./application/accounts/get-server-members-use-case";
import { banAccountUseCaseFactory } from "./application/admin/ban-account-use-case";
import { createInviteCodeUseCaseFactory } from "./application/admin/create-invite-code-use-case";
import { deleteInviteCodeUseCaseFactory } from "./application/admin/delete-invite-code-use-case";
import { getBannedAccountsUseCaseFactory } from "./application/admin/get-banned-accounts-use-case";
import { getInviteCodesUseCaseFactory } from "./application/admin/get-invite-codes-use-case";
import { grantAdminUseCaseFactory } from "./application/admin/grant-admin-use-case";
import { listServerMembersUseCaseFactory } from "./application/admin/list-server-members-use-case";
import { unbanAccountUseCaseFactory } from "./application/admin/unban-account-use-case";
import { toggleFollowUseCaseFactory } from "./application/follow/toggle-follow-use-case";
import { addListMemberUseCaseFactory } from "./application/list/add-list-member-use-case";
import { createListUseCaseFactory } from "./application/list/create-list-use-case";
import { deleteListUseCaseFactory } from "./application/list/delete-list-use-case";
import { getListMembershipUseCaseFactory } from "./application/list/get-list-membership-use-case";
import { getListPageUseCaseFactory } from "./application/list/get-list-page-use-case";
import { getListsPageUseCaseFactory } from "./application/list/get-lists-page-use-case";
import { removeListMemberUseCaseFactory } from "./application/list/remove-list-member-use-case";
import { updateListUseCaseFactory } from "./application/list/update-list-use-case";
import { getLoginStepUseCaseFactory } from "./application/login/get-login-step-use-case";
import { oauthCallbackUseCaseFactory } from "./application/login/oauth-callback-use-case";
import { registerAccountUseCaseFactory } from "./application/login/register-account-use-case";
import { countUnreadNotificationsUseCaseFactory } from "./application/notification/count-unread-notifications-use-case";
import { getNotificationsUseCaseFactory } from "./application/notification/get-notifications-use-case";
import { markNotificationsSeenUseCaseFactory } from "./application/notification/mark-notifications-seen-use-case";
import { createPostUseCaseFactory } from "./application/post/create-post-use-case";
import { deletePostUseCaseFactory } from "./application/post/delete-post-use-case";
import { subscribePushUseCaseFactory } from "./application/push/subscribe-push-use-case";
import { unsubscribePushUseCaseFactory } from "./application/push/unsubscribe-push-use-case";
import { toggleReactionUseCaseFactory } from "./application/reaction/toggle-reaction-use-case";
import { searchUseCaseFactory } from "./application/search/search-use-case";
import { getThreadUseCaseFactory } from "./application/thread/get-thread-use-case";
import { getBackfillStatusUseCaseFactory } from "./application/timeline/get-backfill-status-use-case";
import {
  getLocalTimelineUseCaseFactory,
  getTimelineUseCaseFactory,
} from "./application/timeline/get-timeline-use-case";
import { env } from "./env";
import { accountQueryFactory } from "./infrastructure/account/account-query";
import { adminCommandFactory } from "./infrastructure/admin/admin-command";
import { adminQueryFactory } from "./infrastructure/admin/admin-query";
import { cookieSessionStorageFactory } from "./infrastructure/auth/cookie-session-storage";
import { oauthClientFactory } from "./infrastructure/auth/oauth-client";
import {
  sessionStoreFactory,
  stateStoreFactory,
} from "./infrastructure/auth/oauth-storage";
import { backfillQueryFactory } from "./infrastructure/backfill/backfill-query";
import { dbFactory } from "./infrastructure/db/db";
import { followCommandFactory } from "./infrastructure/follow/follow-command";
import { followQueryFactory } from "./infrastructure/follow/follow-query";
import { jobQueueFactory } from "./infrastructure/job-queue/job-queue";
import { listCommandFactory } from "./infrastructure/list/list-command";
import { listQueryFactory } from "./infrastructure/list/list-query";
import { loggerManagerFactory } from "./infrastructure/logger/logger";
import { notificationCommandFactory } from "./infrastructure/notification/notification-command";
import { notificationQueryFactory } from "./infrastructure/notification/notification-query";
import { postCommandFactory } from "./infrastructure/post/post-command";
import { postQueryFactory } from "./infrastructure/post/post-query";
import { pushSubscriptionCommandFactory } from "./infrastructure/push/push-subscription-command";
import { reactionCommandFactory } from "./infrastructure/reaction/reaction-command";
import { subscopeCommandFactory } from "./infrastructure/subscope/subscope-command";
import { subscopeQueryFactory } from "./infrastructure/subscope/subscope-query";
import { threadQueryFactory } from "./infrastructure/thread/thread-query";
import { timelineQueryFactory } from "./infrastructure/timeline/timeline-query";

export const di = await createRegistry()
  .value("env", env)
  .service("loggerManager", ["env"], loggerManagerFactory)
  .service("db", ["env", "loggerManager"], dbFactory)
  .service("jobQueue", ["env"], jobQueueFactory)
  .service("oauthStateStore", ["db"], stateStoreFactory)
  .service("oauthSessionStore", ["db"], sessionStoreFactory)
  .service(
    "oauthClient",
    ["oauthStateStore", "oauthSessionStore", "loggerManager", "env"],
    oauthClientFactory,
  )
  .service(
    "cookieSessionStorage",
    ["env", "oauthClient"],
    cookieSessionStorageFactory,
  )
  .service("subscopeQuery", ["env", "oauthClient"], subscopeQueryFactory)
  .service("subscopeCommand", ["oauthClient"], subscopeCommandFactory)
  .service("getLoginStepUseCase", ["subscopeQuery"], getLoginStepUseCaseFactory)
  .service(
    "registerAccountUseCase",
    ["subscopeCommand"],
    registerAccountUseCaseFactory,
  )
  .service(
    "oauthCallbackUseCase",
    ["oauthClient", "subscopeQuery", "subscopeCommand", "loggerManager"],
    oauthCallbackUseCaseFactory,
  )
  .service("backfillQuery", ["env"], backfillQueryFactory)
  .service(
    "getServerMembersUseCase",
    ["subscopeQuery", "backfillQuery"],
    getServerMembersUseCaseFactory,
  )
  .service(
    "getFollowedAccountsUseCase",
    ["subscopeQuery", "backfillQuery"],
    getFollowedAccountsUseCaseFactory,
  )
  .service(
    "getBackfillStatusUseCase",
    ["backfillQuery"],
    getBackfillStatusUseCaseFactory,
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
  .service("pushSubscriptionCommand", ["db"], pushSubscriptionCommandFactory)
  .service(
    "subscribePushUseCase",
    ["pushSubscriptionCommand"],
    subscribePushUseCaseFactory,
  )
  .service(
    "unsubscribePushUseCase",
    ["pushSubscriptionCommand"],
    unsubscribePushUseCaseFactory,
  )
  .service("timelineQuery", ["oauthClient"], timelineQueryFactory)
  .service("postCommand", ["oauthClient"], postCommandFactory)
  .service("postQuery", ["oauthClient"], postQueryFactory)
  .service("getTimelineUseCase", ["timelineQuery"], getTimelineUseCaseFactory)
  .service(
    "getLocalTimelineUseCase",
    ["timelineQuery"],
    getLocalTimelineUseCaseFactory,
  )
  .service(
    "createPostUseCase",
    ["postCommand", "postQuery"],
    createPostUseCaseFactory,
  )
  .service(
    "deletePostUseCase",
    ["postCommand", "postQuery"],
    deletePostUseCaseFactory,
  )
  .service("adminQuery", ["oauthClient"], adminQueryFactory)
  .service("adminCommand", ["oauthClient"], adminCommandFactory)
  .service(
    "listServerMembersUseCase",
    ["adminQuery"],
    listServerMembersUseCaseFactory,
  )
  .service("banAccountUseCase", ["adminCommand"], banAccountUseCaseFactory)
  .service("grantAdminUseCase", ["adminCommand"], grantAdminUseCaseFactory)
  .service(
    "getBannedAccountsUseCase",
    ["adminQuery"],
    getBannedAccountsUseCaseFactory,
  )
  .service("unbanAccountUseCase", ["adminCommand"], unbanAccountUseCaseFactory)
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
  .service("accountQuery", ["oauthClient"], accountQueryFactory)
  .service("followQuery", ["env"], followQueryFactory)
  .service("getMeUseCase", ["accountQuery"], getMeUseCaseFactory)
  .service("getProfileUseCase", ["accountQuery"], getProfileUseCaseFactory)
  .service(
    "getFollowListUseCase",
    ["accountQuery", "backfillQuery", "followQuery"],
    getFollowListUseCaseFactory,
  )
  .service(
    "getProfilePageUseCase",
    ["accountQuery", "backfillQuery"],
    getProfilePageUseCaseFactory,
  )
  .service(
    "searchUseCase",
    ["accountQuery", "timelineQuery", "backfillQuery"],
    searchUseCaseFactory,
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
  .service("listQuery", ["oauthClient"], listQueryFactory)
  .service("listCommand", ["oauthClient"], listCommandFactory)
  .service(
    "getListsPageUseCase",
    ["listQuery", "accountQuery"],
    getListsPageUseCaseFactory,
  )
  .service(
    "getListPageUseCase",
    ["listQuery", "backfillQuery"],
    getListPageUseCaseFactory,
  )
  .service(
    "getListMembershipUseCase",
    ["listQuery"],
    getListMembershipUseCaseFactory,
  )
  .service("createListUseCase", ["listCommand"], createListUseCaseFactory)
  .service("updateListUseCase", ["listCommand"], updateListUseCaseFactory)
  .service("deleteListUseCase", ["listCommand"], deleteListUseCaseFactory)
  .service(
    "addListMemberUseCase",
    ["accountQuery", "listCommand"],
    addListMemberUseCaseFactory,
  )
  .service(
    "removeListMemberUseCase",
    ["listCommand"],
    removeListMemberUseCaseFactory,
  )
  .resolve();
