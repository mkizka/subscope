import { LexRouter } from "@atproto/lex-server";
import { toRequestListener } from "@atproto/lex-server/nodejs";
import type { RequestHandler } from "express";

import type { GetFeedGenerators } from "./app/bsky/feed/getFeedGenerators.js";
import type { GetLikes } from "./app/bsky/feed/getLikes.js";
import type { GetPosts } from "./app/bsky/feed/getPosts.js";
import type { GetRepostedBy } from "./app/bsky/feed/getRepostedBy.js";
import type { GetUnreadCount } from "./app/bsky/notification/getUnreadCount.js";
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
  getUnreadCount: GetUnreadCount,
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
  getLikes: GetLikes,
  getRepostedBy: GetRepostedBy,
  getFeedGenerators: GetFeedGenerators,
  getPosts: GetPosts,
): RequestHandler => {
  const handlers = [
    getUnreadCount,
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
    getLikes,
    getRepostedBy,
    getFeedGenerators,
    getPosts,
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
  "getUnreadCount",
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
  "getLikes",
  "getRepostedBy",
  "getFeedGenerators",
  "getPosts",
] as const;
