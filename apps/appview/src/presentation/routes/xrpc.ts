import { createServer } from "@repo/client/server";

import type { GetPreferences } from "./app/bsky/actor/getPreferences.js";
import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";
import type { PutPreferences } from "./app/bsky/actor/putPreferences.js";
import type { SearchActors } from "./app/bsky/actor/searchActors.js";
import type { SearchActorsTypeahead } from "./app/bsky/actor/searchActorsTypeahead.js";
import type { GetActorLikes } from "./app/bsky/feed/getActorLikes.js";
import type { GetAuthorFeed } from "./app/bsky/feed/getAuthorFeed.js";
import type { GetLikes } from "./app/bsky/feed/getLikes.js";
import type { GetPosts } from "./app/bsky/feed/getPosts.js";
import type { GetPostThread } from "./app/bsky/feed/getPostThread.js";
import type { GetRepostedBy } from "./app/bsky/feed/getRepostedBy.js";
import type { GetTimeline } from "./app/bsky/feed/getTimeline.js";
import type { SearchPosts } from "./app/bsky/feed/searchPosts.js";
import type { GetFollowers } from "./app/bsky/graph/getFollowers.js";
import type { GetFollows } from "./app/bsky/graph/getFollows.js";
import type { ListNotifications } from "./app/bsky/notification/listNotifications.js";
import type { CreateInviteCode } from "./me/subsco/admin/createInviteCode.js";
import type { GetInviteCodes } from "./me/subsco/admin/getInviteCodes.js";
import type { GetSubscribers } from "./me/subsco/admin/getSubscribers.js";

export class XRPCRouter {
  private readonly handlers;

  constructor(
    getPreferences: GetPreferences,
    putPreferences: PutPreferences,
    getProfile: GetProfile,
    getProfiles: GetProfiles,
    searchActors: SearchActors,
    searchActorsTypeahead: SearchActorsTypeahead,
    getActorLikes: GetActorLikes,
    getAuthorFeed: GetAuthorFeed,
    getLikes: GetLikes,
    getPosts: GetPosts,
    getPostThread: GetPostThread,
    getRepostedBy: GetRepostedBy,
    getTimeline: GetTimeline,
    searchPosts: SearchPosts,
    getFollows: GetFollows,
    getFollowers: GetFollowers,
    listNotifications: ListNotifications,
    createInviteCode: CreateInviteCode,
    getInviteCodes: GetInviteCodes,
    getSubscribers: GetSubscribers,
  ) {
    this.handlers = [
      getPreferences,
      putPreferences,
      getProfile,
      getProfiles,
      searchActors,
      searchActorsTypeahead,
      getActorLikes,
      getAuthorFeed,
      getLikes,
      getPosts,
      getPostThread,
      getRepostedBy,
      getTimeline,
      searchPosts,
      getFollows,
      getFollowers,
      listNotifications,
      createInviteCode,
      getInviteCodes,
      getSubscribers,
    ];
  }
  static inject = [
    "getPreferences",
    "putPreferences",
    "getProfile",
    "getProfiles",
    "searchActors",
    "searchActorsTypeahead",
    "getActorLikes",
    "getAuthorFeed",
    "getLikes",
    "getPosts",
    "getPostThread",
    "getRepostedBy",
    "getTimeline",
    "searchPosts",
    "getFollows",
    "getFollowers",
    "listNotifications",
    "createInviteCode",
    "getInviteCodes",
    "getSubscribers",
  ] as const;

  create() {
    const server = createServer();
    for (const handler of this.handlers) {
      handler.handle(server);
    }
    return server.xrpc.router;
  }
}
