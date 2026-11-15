import { migrateDatabase } from "@repo/common/infrastructure";

import { env } from "./shared/env.js";
import { createAppRegistry } from "./shared/registry.js";

await migrateDatabase(env.DATABASE_URL);

const services = await createAppRegistry(env).resolve();

services.appViewServer.start();
