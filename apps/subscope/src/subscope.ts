import { createInjector } from "typed-inject";

import { SubscopeServer } from "./bootstrap/server.js";
import {
  authMiddleware,
  oauthRouter,
  trpcRouter,
} from "./features/bff/router.js";
import {
  blobProxyRouter,
  cacheCleanupScheduler,
} from "./features/blob-proxy/router.js";
import { clientRouter } from "./features/client/router.js";
import { dashboardRouter } from "./features/dashboard/router.js";
import {
  healthRouter,
  wellKnownRouter,
  xrpcRouter,
} from "./features/xrpc/router.js";

createInjector()
  .provideValue("authMiddleware", authMiddleware)
  .provideValue("dashboardRouter", dashboardRouter)
  .provideValue("oauthRouter", oauthRouter)
  .provideValue("clientRouter", clientRouter)
  .provideValue("blobProxyRouter", blobProxyRouter)
  .provideValue("trpcRouter", trpcRouter)
  .provideValue("xrpcRouter", xrpcRouter)
  .provideValue("healthRouter", healthRouter)
  .provideValue("wellKnownRouter", wellKnownRouter)
  .provideValue("cacheCleanupScheduler", cacheCleanupScheduler)
  .injectClass(SubscopeServer)
  .start();
