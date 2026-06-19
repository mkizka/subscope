import { env } from "./shared/env.js";
import { createAppRegistry } from "./shared/registry.js";

const services = await createAppRegistry(env).resolve();

services.appViewServer.start();
