import { createServer } from "@repo/client/server";

import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";
import type { SearchActors } from "./app/bsky/actor/searchActors.js";
import type { GetPosts } from "./app/bsky/feed/getPosts.js";
import type { GetTimeline } from "./app/bsky/feed/getTimeline.js";
import type { GetJobStatus } from "./dev/mkizka/test/getJobStatus.js";

export class XRPCRouter {
  private readonly handlers;

  constructor(
    getProfile: GetProfile,
    getProfiles: GetProfiles,
    searchActors: SearchActors,
    getPosts: GetPosts,
    getTimeline: GetTimeline,
    getJobStatus: GetJobStatus,
  ) {
    this.handlers = [
      getProfile,
      getProfiles,
      searchActors,
      getPosts,
      getTimeline,
      getJobStatus,
    ];
  }
  static inject = [
    "getProfile",
    "getProfiles",
    "searchActors",
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
