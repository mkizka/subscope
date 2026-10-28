import { createServer } from "@repo/client/server";
import type { Router } from "express";

import type { GetFeedGenerators } from "./app/bsky/feed/getFeedGenerators.js";
import type { GetLikes } from "./app/bsky/feed/getLikes.js";
import type { GetPosts } from "./app/bsky/feed/getPosts.js";
import type { GetRepostedBy } from "./app/bsky/feed/getRepostedBy.js";

export const xrpcRouterFactory = (
  getFeedGenerators: GetFeedGenerators,
  getLikes: GetLikes,
  getPosts: GetPosts,
  getRepostedBy: GetRepostedBy,
): Router => {
  const handlers = [
    getFeedGenerators,
    getLikes,
    getPosts,
    getRepostedBy,
  ];

  const server = createServer();
  for (const handler of handlers) {
    handler.handle(server);
  }
  return server.xrpc.router;
};
xrpcRouterFactory.inject = [
  "getFeedGenerators",
  "getLikes",
  "getPosts",
  "getRepostedBy",
] as const;
