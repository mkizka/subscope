import { LoggerManager } from "@dawn/common/infrastructure";
import { createInjector } from "typed-inject";

import { JetstreamIngester } from "./server/jetstream.js";
import { QueueService } from "./server/queue.js";
import { IngesterServer } from "./server/server.js";
import { env } from "./shared/env.js";

createInjector()
  .provideValue("config", { ...env, DATABASE_URL: "" }) // TODO: logger用の設定を分ける
  .provideClass("loggerManager", LoggerManager)
  .provideClass("queueService", QueueService)
  .provideClass("ingester", JetstreamIngester)
  .injectClass(IngesterServer)
  .start();
