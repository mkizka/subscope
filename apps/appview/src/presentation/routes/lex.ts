import { LexRouter } from "@atproto/lex-server";
import { toRequestListener } from "@atproto/lex-server/nodejs";
import type { RequestHandler } from "express";

import type { GetPreferences } from "./app/bsky/actor/getPreferences.js";
import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";
import type { SearchActors } from "./app/bsky/actor/searchActors.js";
import type { SearchActorsTypeahead } from "./app/bsky/actor/searchActorsTypeahead.js";
import type { CreateInviteCode } from "./me/subsco/admin/createInviteCode.js";
import type { DeleteInviteCode } from "./me/subsco/admin/deleteInviteCode.js";
import type { GetInviteCodes } from "./me/subsco/admin/getInviteCodes.js";
import type { GetSubscribers } from "./me/subsco/admin/getSubscribers.js";
import type { RegisterAdmin } from "./me/subsco/admin/registerAdmin.js";
import type { VerifyAccess } from "./me/subsco/admin/verifyAccess.js";
import type { GetSetupStatus } from "./me/subsco/server/getSetupStatus.js";
import type { GetSubscriptionStatus } from "./me/subsco/sync/getSubscriptionStatus.js";
import type { SubscribeServer } from "./me/subsco/sync/subscribeServer.js";
import type { UnsubscribeServer } from "./me/subsco/sync/unsubscribeServer.js";

export const lexRouterFactory = (
  getSubscriptionStatus: GetSubscriptionStatus,
  subscribeServer: SubscribeServer,
  unsubscribeServer: UnsubscribeServer,
  createInviteCode: CreateInviteCode,
  deleteInviteCode: DeleteInviteCode,
  getInviteCodes: GetInviteCodes,
  registerAdmin: RegisterAdmin,
  verifyAccess: VerifyAccess,
  getSetupStatus: GetSetupStatus,
  getPreferences: GetPreferences,
  getProfile: GetProfile,
  getProfiles: GetProfiles,
  searchActors: SearchActors,
  searchActorsTypeahead: SearchActorsTypeahead,
  getSubscribers: GetSubscribers,
): RequestHandler => {
  const handlers = [
    getSubscriptionStatus,
    subscribeServer,
    unsubscribeServer,
    createInviteCode,
    deleteInviteCode,
    getInviteCodes,
    registerAdmin,
    verifyAccess,
    getSetupStatus,
    getPreferences,
    getProfile,
    getProfiles,
    searchActors,
    searchActorsTypeahead,
    getSubscribers,
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
  "getSubscriptionStatus",
  "subscribeServer",
  "unsubscribeServer",
  "createInviteCode",
  "deleteInviteCode",
  "getInviteCodes",
  "registerAdmin",
  "verifyAccess",
  "getSetupStatus",
  "getPreferences",
  "getProfile",
  "getProfiles",
  "searchActors",
  "searchActorsTypeahead",
  "getSubscribers",
] as const;
