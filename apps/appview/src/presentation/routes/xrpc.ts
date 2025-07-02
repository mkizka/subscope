import { createServer } from "@repo/client/server";

import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";
import type { GetActorLikes } from "./app/bsky/feed/getActorLikes.js";
import type { GetAuthorFeed } from "./app/bsky/feed/getAuthorFeed.js";
import type { GetLikes } from "./app/bsky/feed/getLikes.js";
import type { GetPosts } from "./app/bsky/feed/getPosts.js";
import type { GetPostThread } from "./app/bsky/feed/getPostThread.js";
import type { GetRepostedBy } from "./app/bsky/feed/getRepostedBy.js";
import type { GetTimeline } from "./app/bsky/feed/getTimeline.js";
import type { GetJobStatus } from "./dev/mkizka/test/getJobStatus.js";

export class XRPCRouter {
  private readonly handlers;

  constructor(
    getProfile: GetProfile,
    getProfiles: GetProfiles,
    getActorLikes: GetActorLikes,
    getAuthorFeed: GetAuthorFeed,
    getLikes: GetLikes,
    getPosts: GetPosts,
    getPostThread: GetPostThread,
    getRepostedBy: GetRepostedBy,
    getTimeline: GetTimeline,
    getJobStatus: GetJobStatus,
  ) {
    this.handlers = [
      getProfile,
      getProfiles,
      getActorLikes,
      getAuthorFeed,
      getLikes,
      getPosts,
      getPostThread,
      getRepostedBy,
      getTimeline,
      getJobStatus,
    ];
  }
  static inject = [
    "getProfile",
    "getProfiles",
    "getActorLikes",
    "getAuthorFeed",
    "getLikes",
    "getPosts",
    "getPostThread",
    "getRepostedBy",
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
