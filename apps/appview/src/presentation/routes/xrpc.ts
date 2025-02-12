import { createServer } from "@dawn/client";

import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";
import type { GetPosts } from "./app/bsky/feed/getPosts.js";
import type { GetTimeline } from "./app/bsky/feed/getTimeline.js";

export class XRPCRouter {
  private readonly handlers;

  constructor(
    getProfile: GetProfile,
    getProfiles: GetProfiles,
    getPosts: GetPosts,
    getTimeline: GetTimeline,
  ) {
    this.handlers = [getProfile, getProfiles, getPosts, getTimeline];
  }
  static inject = [
    "getProfile",
    "getProfiles",
    "getPosts",
    "getTimeline",
  ] as const;

  create() {
    const server = createServer();
    for (const handler of this.handlers) {
      handler.handle(server);
    }
    return server.xrpc.router;
  }
}
