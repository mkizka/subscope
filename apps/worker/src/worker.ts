import { env } from "./shared/env.js";
import { createWorkerRegistry } from "./shared/registry.js";

const services = await createWorkerRegistry(env).resolve();

services.workerServer.start();
