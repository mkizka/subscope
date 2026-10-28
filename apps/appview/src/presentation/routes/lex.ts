import { LexRouter } from "@atproto/lex-server";
import { toRequestListener } from "@atproto/lex-server/nodejs";
import type { RequestHandler } from "express";

import type { GetSubscriptionStatus } from "./me/subsco/sync/getSubscriptionStatus.js";
import type { SubscribeServer } from "./me/subsco/sync/subscribeServer.js";
import type { UnsubscribeServer } from "./me/subsco/sync/unsubscribeServer.js";

export const lexRouterFactory = (
  getSubscriptionStatus: GetSubscriptionStatus,
  subscribeServer: SubscribeServer,
  unsubscribeServer: UnsubscribeServer,
): RequestHandler => {
  const handlers = [getSubscriptionStatus, subscribeServer, unsubscribeServer];

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
] as const;
