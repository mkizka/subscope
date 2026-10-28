import { createServer } from "@repo/client/server";
import type { Router } from "express";

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
import type { SearchPosts } from "./app/bsky/feed/searchPosts.js";
import type { GetFollowers } from "./app/bsky/graph/getFollowers.js";
import type { GetFollows } from "./app/bsky/graph/getFollows.js";
import type { GetList } from "./app/bsky/graph/getList.js";
import type { GetLists } from "./app/bsky/graph/getLists.js";
import type { GetUnreadCount } from "./app/bsky/notification/getUnreadCount.js";
import type { ListNotifications } from "./app/bsky/notification/listNotifications.js";
import type { UpdateSeen } from "./app/bsky/notification/updateSeen.js";
import type { GetSubscribers } from "./me/subsco/admin/getSubscribers.js";

export const xrpcRouterFactory = (
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
  searchPosts: SearchPosts,
  getFollows: GetFollows,
  getFollowers: GetFollowers,
  getList: GetList,
  getLists: GetLists,
  getUnreadCount: GetUnreadCount,
  listNotifications: ListNotifications,
  getSubscribers: GetSubscribers,
  updateSeen: UpdateSeen,
): Router => {
  const handlers = [
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
    searchPosts,
    getFollows,
    getFollowers,
    getList,
    getLists,
    getUnreadCount,
    listNotifications,
    getSubscribers,
    updateSeen,
  ];

  const server = createServer();
  for (const handler of handlers) {
    handler.handle(server);
  }
  return server.xrpc.router;
};
xrpcRouterFactory.inject = [
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
  "searchPosts",
  "getFollows",
  "getFollowers",
  "getList",
  "getLists",
  "getUnreadCount",
  "listNotifications",
  "getSubscribers",
  "updateSeen",
] as const;
