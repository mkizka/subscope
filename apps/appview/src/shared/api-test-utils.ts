import { once } from "node:events";
import type { AddressInfo } from "node:net";

import { asDid } from "@atproto/did";
import { asClassArgs } from "@gyaku/di";
import { AtpBaseClient } from "@repo/client/api";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
} from "@repo/common/test";
import { testSetup } from "@repo/test-utils";
import express from "express";
import { onTestFinished } from "vitest";

import { createAppRegistry } from "./registry.js";
import { testEnv } from "./test-utils.js";

// prettier-ignore
const apiTestRegistry = createAppRegistry(testEnv)
  .replaceValue("db", testSetup.ctx.db)
  .replaceService("jobQueue", asClassArgs(InMemoryJobQueue))
  .replaceService("jobScheduler", asClassArgs(InMemoryJobScheduler))
  .replaceService("didCache", asClassArgs(InMemoryDidCache))
  .replaceService("didResolver", asClassArgs(InMemoryDidResolver))
  .replaceValue("tokenVerifier", { verify: ({ token }: { token: string }) => Promise.resolve({ did: asDid(token) }) });

export const setupApiTest = async () => {
  const services = await apiTestRegistry.resolve();
  const server = express()
    .use(services.lexRouter)
    .use(services.xrpcRouter)
    .listen(0);
  await once(server, "listening");
  onTestFinished(() => {
    server.close();
  });
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { port } = server.address() as AddressInfo;
  const createClient = () => new AtpBaseClient(`http://localhost:${port}`);
  const client = createClient();
  const loginAs = (did: string, target = client) => {
    target.setHeader("authorization", `Bearer ${did}`);
  };
  return { client, createClient, loginAs };
};
