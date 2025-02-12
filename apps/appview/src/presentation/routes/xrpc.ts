import { createServer } from "@dawn/client";

import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";
import type { GetPosts } from "./app/bsky/feed/getPosts.js";
import type { GetTimeline } from "./app/bsky/feed/getTimeline.js";

export class XRPCRoutes {
  constructor(
    private readonly getProfile: GetProfile,
    private readonly getProfiles: GetProfiles,
    private readonly getPosts: GetPosts,
    private readonly getTimeline: GetTimeline,
  ) {}
  static inject = [
    "getProfile",
    "getProfiles",
    "getPosts",
    "getTimeline",
  ] as const;

  create() {
    const server = createServer();
    this.getProfile.handle(server);
    this.getProfiles.handle(server);
    this.getPosts.handle(server);
    this.getTimeline.handle(server);
    return server.xrpc.routes;
  }
}
