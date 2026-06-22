import { env } from "./shared/env.js";
import { createIngesterRegistry } from "./shared/registry.js";

const services = await createIngesterRegistry(env).resolve();

services.ingesterServer.start();
