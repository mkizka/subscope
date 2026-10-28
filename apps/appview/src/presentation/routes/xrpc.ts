import { createServer } from "@repo/client/server";
import type { Router } from "express";

import type { GetActorLikes } from "./app/bsky/feed/getActorLikes.js";
import type { GetAuthorFeed } from "./app/bsky/feed/getAuthorFeed.js";
import type { GetFeedGenerators } from "./app/bsky/feed/getFeedGenerators.js";
import type { GetLikes } from "./app/bsky/feed/getLikes.js";
import type { GetPosts } from "./app/bsky/feed/getPosts.js";
import type { GetRepostedBy } from "./app/bsky/feed/getRepostedBy.js";
import type { GetTimeline } from "./app/bsky/feed/getTimeline.js";

export const xrpcRouterFactory = (
  getActorLikes: GetActorLikes,
  getAuthorFeed: GetAuthorFeed,
  getFeedGenerators: GetFeedGenerators,
  getLikes: GetLikes,
  getPosts: GetPosts,
  getRepostedBy: GetRepostedBy,
  getTimeline: GetTimeline,
): Router => {
  const handlers = [
    getActorLikes,
    getAuthorFeed,
    getFeedGenerators,
    getLikes,
    getPosts,
    getRepostedBy,
    getTimeline,
  ];

  const server = createServer();
  for (const handler of handlers) {
    handler.handle(server);
  }
  return server.xrpc.router;
};
xrpcRouterFactory.inject = [
  "getActorLikes",
  "getAuthorFeed",
  "getFeedGenerators",
  "getLikes",
  "getPosts",
  "getRepostedBy",
  "getTimeline",
] as const;
