import { LexRouter } from "@atproto/lex-server";
import { toRequestListener } from "@atproto/lex-server/nodejs";
import type { RequestHandler } from "express";

import type { GetUnreadCount } from "./app/bsky/notification/getUnreadCount.js";
import type { UpdateSeen } from "./app/bsky/notification/updateSeen.js";
import type { GetSubscriptionStatus } from "./me/subsco/sync/getSubscriptionStatus.js";
import type { SubscribeServer } from "./me/subsco/sync/subscribeServer.js";
import type { UnsubscribeServer } from "./me/subsco/sync/unsubscribeServer.js";

export const lexRouterFactory = (
  getUnreadCount: GetUnreadCount,
  updateSeen: UpdateSeen,
  getSubscriptionStatus: GetSubscriptionStatus,
  subscribeServer: SubscribeServer,
  unsubscribeServer: UnsubscribeServer,
): RequestHandler => {
  const handlers = [
    getUnreadCount,
    updateSeen,
    getSubscriptionStatus,
    subscribeServer,
    unsubscribeServer,
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
] as const;
