import { createServer } from "@repo/client/server";
import type { Router } from "express";

import type { GetPreferences } from "./app/bsky/actor/getPreferences.js";
import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";
import type { SearchActors } from "./app/bsky/actor/searchActors.js";
import type { SearchActorsTypeahead } from "./app/bsky/actor/searchActorsTypeahead.js";
import type { GetActorLikes } from "./app/bsky/feed/getActorLikes.js";
import type { GetAuthorFeed } from "./app/bsky/feed/getAuthorFeed.js";
import type { GetPostThread } from "./app/bsky/feed/getPostThread.js";
import type { GetTimeline } from "./app/bsky/feed/getTimeline.js";
import type { SearchPosts } from "./app/bsky/feed/searchPosts.js";
import type { GetFollowers } from "./app/bsky/graph/getFollowers.js";
import type { GetFollows } from "./app/bsky/graph/getFollows.js";
import type { GetList } from "./app/bsky/graph/getList.js";
import type { GetLists } from "./app/bsky/graph/getLists.js";
import type { ListNotifications } from "./app/bsky/notification/listNotifications.js";
import type { GetSubscribers } from "./me/subsco/admin/getSubscribers.js";

export const xrpcRouterFactory = (
  getPreferences: GetPreferences,
  getProfile: GetProfile,
  getProfiles: GetProfiles,
  searchActors: SearchActors,
  searchActorsTypeahead: SearchActorsTypeahead,
  getActorLikes: GetActorLikes,
  getAuthorFeed: GetAuthorFeed,
  getPostThread: GetPostThread,
  getTimeline: GetTimeline,
  searchPosts: SearchPosts,
  getFollows: GetFollows,
  getFollowers: GetFollowers,
  getList: GetList,
  getLists: GetLists,
  listNotifications: ListNotifications,
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
    getPostThread,
    getTimeline,
    searchPosts,
    getFollows,
    getFollowers,
    getList,
    getLists,
    listNotifications,
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
  "getPostThread",
  "getTimeline",
  "searchPosts",
  "getFollows",
  "getFollowers",
  "getList",
  "getLists",
  "listNotifications",
  "getSubscribers",
] as const;
