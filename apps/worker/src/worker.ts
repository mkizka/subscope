import { migrateDatabase } from "@repo/common/infrastructure";

import { env } from "./shared/env.js";
import { createWorkerRegistry } from "./shared/registry.js";

await migrateDatabase(env.DATABASE_URL);

const services = await createWorkerRegistry(env).resolve();

services.workerServer.start();
