import type { Server } from "@dawn/client";

import type { GetProfile } from "./app/bsky/actor/getProfile.js";

export class XRPCRoutes {
  constructor(private getProfile: GetProfile) {}
  static inject = ["getProfile"] as const;

  register(server: Server) {
    this.getProfile.handle(server);
  }
}
