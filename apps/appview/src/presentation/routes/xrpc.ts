import { createServer } from "@dawn/client/server";

import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";
import type { GetPosts } from "./app/bsky/feed/getPosts.js";
import type { GetTimeline } from "./app/bsky/feed/getTimeline.js";
import type { GetJobStatus } from "./dev/mkizka/test/getJobStatus.js";

export class XRPCRouter {
  private readonly handlers;

  constructor(
    getProfile: GetProfile,
    getProfiles: GetProfiles,
    getPosts: GetPosts,
    getTimeline: GetTimeline,
    getJobStatus: GetJobStatus,
  ) {
    this.handlers = [
      getProfile,
      getProfiles,
      getPosts,
      getTimeline,
      getJobStatus,
    ];
  }
  static inject = [
    "getProfile",
    "getProfiles",
    "getPosts",
    "getTimeline",
    "getJobStatus",
  ] as const;

  create() {
    const server = createServer();
    for (const handler of this.handlers) {
      handler.handle(server);
    }
    return server.xrpc.router;
  }
}
