import { once } from "node:events";
import type { AddressInfo } from "node:net";

import { asDid } from "@atproto/did";
import { Client } from "@atproto/lex";
import { asClassArgs } from "@gyaku/di";
import { InMemoryJobScheduler } from "@repo/common/infrastructure";
import {
  InMemoryDidCache,
  InMemoryDidResolver,
  InMemoryJobQueue,
} from "@repo/common/test";
import { testSetup } from "@repo/test-utils";
import express from "express";
import { onTestFinished } from "vitest";

import { InMemoryTokenVerifier } from "../infrastructure/token-verifier/token-verifier.in-memory.js";
import { createAppRegistry } from "./registry.js";
import { testEnv } from "./test-utils.js";

// prettier-ignore
const apiTestRegistry = createAppRegistry(testEnv)
  .replaceValue("db", testSetup.ctx.db)
  .replaceService("jobQueue", asClassArgs(InMemoryJobQueue))
  .replaceService("jobScheduler", asClassArgs(InMemoryJobScheduler))
  .replaceService("didCache", asClassArgs(InMemoryDidCache))
  .replaceService("didResolver", asClassArgs(InMemoryDidResolver))
  .replaceService("tokenVerifier", asClassArgs(InMemoryTokenVerifier));

export const setupApiTest = async () => {
  const services = await apiTestRegistry.resolve();
  const server = express().use(services.lexRouter).listen(0);
  await once(server, "listening");
  onTestFinished(() => {
    server.close();
  });
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { port } = server.address() as AddressInfo;
  const client = new Client(`http://localhost:${port}`);
  const loginAs = (did: string) => {
    services.tokenVerifier.setVerifyResult({ did: asDid(did) });
    client.headers.set("authorization", "Bearer token");
  };
  return { client, loginAs };
};
