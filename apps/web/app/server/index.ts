import { env } from "./shared/env.js";
import { createWebRegistry } from "./shared/registry.js";

export const services = await createWebRegistry(env).resolve();
