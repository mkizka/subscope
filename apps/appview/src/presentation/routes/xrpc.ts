import { createServer } from "@dawn/client";

import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";
import type { GetPosts } from "./app/bsky/feed/getPosts.js";

export class XRPCRoutes {
  constructor(
    private readonly getProfile: GetProfile,
    private readonly getProfiles: GetProfiles,
    private readonly getPosts: GetPosts,
  ) {}
  static inject = ["getProfile", "getProfiles", "getPosts"] as const;

  create() {
    const server = createServer();
    this.getProfile.handle(server);
    this.getProfiles.handle(server);
    this.getPosts.handle(server);
    return server.xrpc.routes;
  }
}
