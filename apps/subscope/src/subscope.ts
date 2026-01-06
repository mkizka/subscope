import { createInjector } from "typed-inject";

import { SubscopeServer } from "./bootstrap/server.js";
import {
  blobProxyRouter,
  cacheCleanupScheduler,
} from "./features/blob-proxy/router.js";
import { clientRouter } from "./features/client/router.js";
import { dashboardRouter } from "./features/dashboard/router.js";
import { authMiddleware, oauthRouter } from "./features/oauth/router.js";

createInjector()
  .provideValue("authMiddleware", authMiddleware)
  .provideValue("dashboardRouter", dashboardRouter)
  .provideValue("oauthRouter", oauthRouter)
  .provideValue("clientRouter", clientRouter)
  .provideValue("blobProxyRouter", blobProxyRouter)
  .provideValue("cacheCleanupScheduler", cacheCleanupScheduler)
  .injectClass(SubscopeServer)
  .start();
