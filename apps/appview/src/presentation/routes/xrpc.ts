import { createServer } from "@repo/client/server";
import type { Router } from "express";

import type { GetPreferences } from "./app/bsky/actor/getPreferences.js";
import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";
import type { SearchActors } from "./app/bsky/actor/searchActors.js";
import type { SearchActorsTypeahead } from "./app/bsky/actor/searchActorsTypeahead.js";
import type { GetActorLikes } from "./app/bsky/feed/getActorLikes.js";
import type { GetAuthorFeed } from "./app/bsky/feed/getAuthorFeed.js";
import type { GetFeedGenerators } from "./app/bsky/feed/getFeedGenerators.js";
import type { GetLikes } from "./app/bsky/feed/getLikes.js";
import type { GetPosts } from "./app/bsky/feed/getPosts.js";
import type { GetPostThread } from "./app/bsky/feed/getPostThread.js";
import type { GetRepostedBy } from "./app/bsky/feed/getRepostedBy.js";
import type { GetTimeline } from "./app/bsky/feed/getTimeline.js";
import type { GetSubscribers } from "./me/subsco/admin/getSubscribers.js";

export const xrpcRouterFactory = (
  getPreferences: GetPreferences,
  getProfile: GetProfile,
  getProfiles: GetProfiles,
  searchActors: SearchActors,
  searchActorsTypeahead: SearchActorsTypeahead,
  getActorLikes: GetActorLikes,
  getAuthorFeed: GetAuthorFeed,
  getFeedGenerators: GetFeedGenerators,
  getLikes: GetLikes,
  getPosts: GetPosts,
  getPostThread: GetPostThread,
  getRepostedBy: GetRepostedBy,
  getTimeline: GetTimeline,
  getSubscribers: GetSubscribers,
): Router => {
  const handlers = [
    getPreferences,
    getProfile,
    getProfiles,
    searchActors,
    searchActorsTypeahead,
    getActorLikes,
    getAuthorFeed,
    getFeedGenerators,
    getLikes,
    getPosts,
    getPostThread,
    getRepostedBy,
    getTimeline,
    getSubscribers,
  ];

  const server = createServer();
  for (const handler of handlers) {
    handler.handle(server);
  }
  return server.xrpc.router;
};
xrpcRouterFactory.inject = [
  "getPreferences",
  "getProfile",
  "getProfiles",
  "searchActors",
  "searchActorsTypeahead",
  "getActorLikes",
  "getAuthorFeed",
  "getFeedGenerators",
  "getLikes",
  "getPosts",
  "getPostThread",
  "getRepostedBy",
  "getTimeline",
  "getSubscribers",
] as const;
