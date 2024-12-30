import client from "@dawn/client";

import type { GetProfile } from "./app/bsky/actor/getProfile.js";

export class XRPCRoutes {
  constructor(private getProfile: GetProfile) {}
  static inject = ["getProfile"] as const;

  create() {
    const server = client.createServer();
    this.getProfile.handle(server);
    return server.xrpc.routes;
  }
}
