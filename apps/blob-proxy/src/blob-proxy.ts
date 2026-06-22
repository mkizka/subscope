import { env } from "./shared/env.js";
import { createBlobProxyRegistry } from "./shared/registry.js";

const services = await createBlobProxyRegistry(env).resolve();

services.blobProxyServer.start();
