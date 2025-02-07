import { createServer } from "@dawn/client";

import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";

export class XRPCRoutes {
  constructor(
    private getProfile: GetProfile,
    private getProfiles: GetProfiles,
  ) {}
  static inject = ["getProfile", "getProfiles"] as const;

  create() {
    const server = createServer();
    this.getProfile.handle(server);
    this.getProfiles.handle(server);
    return server.xrpc.routes;
  }
}
