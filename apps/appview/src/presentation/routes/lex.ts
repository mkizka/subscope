import { LexRouter } from "@atproto/lex-server";
import { toRequestListener } from "@atproto/lex-server/nodejs";
import type { RequestHandler } from "express";

import type { SearchPosts } from "./app/bsky/feed/searchPosts.js";
import type { GetFollowers } from "./app/bsky/graph/getFollowers.js";
import type { GetFollows } from "./app/bsky/graph/getFollows.js";
import type { GetList } from "./app/bsky/graph/getList.js";
import type { GetLists } from "./app/bsky/graph/getLists.js";
import type { GetUnreadCount } from "./app/bsky/notification/getUnreadCount.js";
import type { ListNotifications } from "./app/bsky/notification/listNotifications.js";
import type { UpdateSeen } from "./app/bsky/notification/updateSeen.js";
import type { CreateInviteCode } from "./me/subsco/admin/createInviteCode.js";
import type { DeleteInviteCode } from "./me/subsco/admin/deleteInviteCode.js";
import type { GetInviteCodes } from "./me/subsco/admin/getInviteCodes.js";
import type { RegisterAdmin } from "./me/subsco/admin/registerAdmin.js";
import type { VerifyAccess } from "./me/subsco/admin/verifyAccess.js";
import type { GetSetupStatus } from "./me/subsco/server/getSetupStatus.js";
import type { GetSubscriptionStatus } from "./me/subsco/sync/getSubscriptionStatus.js";
import type { SubscribeServer } from "./me/subsco/sync/subscribeServer.js";
import type { UnsubscribeServer } from "./me/subsco/sync/unsubscribeServer.js";

export const lexRouterFactory = (
  searchPosts: SearchPosts,
  getFollows: GetFollows,
  getFollowers: GetFollowers,
  getList: GetList,
  getLists: GetLists,
  getUnreadCount: GetUnreadCount,
  listNotifications: ListNotifications,
  updateSeen: UpdateSeen,
  getSubscriptionStatus: GetSubscriptionStatus,
  subscribeServer: SubscribeServer,
  unsubscribeServer: UnsubscribeServer,
  createInviteCode: CreateInviteCode,
  deleteInviteCode: DeleteInviteCode,
  getInviteCodes: GetInviteCodes,
  registerAdmin: RegisterAdmin,
  verifyAccess: VerifyAccess,
  getSetupStatus: GetSetupStatus,
): RequestHandler => {
  const handlers = [
    searchPosts,
    getFollows,
    getFollowers,
    getList,
    getLists,
    getUnreadCount,
    listNotifications,
    updateSeen,
    getSubscriptionStatus,
    subscribeServer,
    unsubscribeServer,
    createInviteCode,
    deleteInviteCode,
    getInviteCodes,
    registerAdmin,
    verifyAccess,
    getSetupStatus,
  ];

  const router = new LexRouter();
  for (const handler of handlers) {
    handler.handle(router);
  }
  const paths = new Set(
    Array.from(router.handlers.keys(), (nsid) => `/xrpc/${nsid}`),
  );
  const listener = toRequestListener(router.fetch);
  return (req, res, next) => {
    if (paths.has(req.path)) {
      listener(req, res, next);
    } else {
      next();
    }
  };
};
lexRouterFactory.inject = [
  "searchPosts",
  "getFollows",
  "getFollowers",
  "getList",
  "getLists",
  "getUnreadCount",
  "listNotifications",
  "updateSeen",
  "getSubscriptionStatus",
  "subscribeServer",
  "unsubscribeServer",
  "createInviteCode",
  "deleteInviteCode",
  "getInviteCodes",
  "registerAdmin",
  "verifyAccess",
  "getSetupStatus",
] as const;
