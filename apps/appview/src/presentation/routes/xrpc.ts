import { createServer } from "@repo/client/server";

import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";
import type { GetLikes } from "./app/bsky/feed/getLikes.js";
import type { GetPosts } from "./app/bsky/feed/getPosts.js";
import type { GetPostThread } from "./app/bsky/feed/getPostThread.js";
import type { GetTimeline } from "./app/bsky/feed/getTimeline.js";
import type { GetJobStatus } from "./dev/mkizka/test/getJobStatus.js";

export class XRPCRouter {
  private readonly handlers;

  constructor(
    getProfile: GetProfile,
    getProfiles: GetProfiles,
    getLikes: GetLikes,
    getPosts: GetPosts,
    getPostThread: GetPostThread,
    getTimeline: GetTimeline,
    getJobStatus: GetJobStatus,
  ) {
    this.handlers = [
      getProfile,
      getProfiles,
      getLikes,
      getPosts,
      getPostThread,
      getTimeline,
      getJobStatus,
    ];
  }
  static inject = [
    "getProfile",
    "getProfiles",
    "getLikes",
    "getPosts",
    "getPostThread",
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
