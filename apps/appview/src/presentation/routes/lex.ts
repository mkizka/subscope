import { LexRouter } from "@atproto/lex-server";
import { toRequestListener } from "@atproto/lex-server/nodejs";
import type { RequestHandler } from "express";

import type { GetPreferences } from "./app/bsky/actor/getPreferences.js";
import type { GetProfile } from "./app/bsky/actor/getProfile.js";
import type { GetProfiles } from "./app/bsky/actor/getProfiles.js";
import type { SearchActors } from "./app/bsky/actor/searchActors.js";
import type { SearchActorsTypeahead } from "./app/bsky/actor/searchActorsTypeahead.js";
import type { GetActorLikes } from "./app/bsky/feed/getActorLikes.js";
import type { GetAuthorFeed } from "./app/bsky/feed/getAuthorFeed.js";
import type { GetFeedGenerators } from "./app/bsky/feed/getFeedGenerators.js";
import type { GetLikes } from "./app/bsky/feed/getLikes.js";
import type { GetListFeed } from "./app/bsky/feed/getListFeed.js";
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
import type { CreateInviteCode } from "./me/subsco/admin/createInviteCode.js";
import type { DeleteInviteCode } from "./me/subsco/admin/deleteInviteCode.js";
import type { GetInviteCodes } from "./me/subsco/admin/getInviteCodes.js";
import type { GetSubscribers } from "./me/subsco/admin/getSubscribers.js";
import type { GrantAdmin } from "./me/subsco/admin/grantAdmin.js";
import type { RegisterAdmin } from "./me/subsco/admin/registerAdmin.js";
import type { VerifyAccess } from "./me/subsco/admin/verifyAccess.js";
import type { GetMembers } from "./me/subsco/server/getMembers.js";
import type { GetSetupStatus } from "./me/subsco/server/getSetupStatus.js";
import type { GetTrackedActors } from "./me/subsco/server/getTrackedActors.js";
import type { GetSubscriptionStatus } from "./me/subsco/sync/getSubscriptionStatus.js";
import type { SubscribeServer } from "./me/subsco/sync/subscribeServer.js";
import type { UnsubscribeServer } from "./me/subsco/sync/unsubscribeServer.js";

export const lexRouterFactory = (
  getPostThread: GetPostThread,
  searchPosts: SearchPosts,
  getActorLikes: GetActorLikes,
  getAuthorFeed: GetAuthorFeed,
  getTimeline: GetTimeline,
  getListFeed: GetListFeed,
  getFollows: GetFollows,
  getFollowers: GetFollowers,
  getList: GetList,
  getLists: GetLists,
  getUnreadCount: GetUnreadCount,
  listNotifications: ListNotifications,
  updateSeen: UpdateSeen,
  getSubscriptionStatus: GetSubscriptionStatus,
  subscribeServer: SubscribeServer,
  unsubscribeServer: UnsubscribeServer,
  createInviteCode: CreateInviteCode,
  deleteInviteCode: DeleteInviteCode,
  getInviteCodes: GetInviteCodes,
  grantAdmin: GrantAdmin,
  registerAdmin: RegisterAdmin,
  verifyAccess: VerifyAccess,
  getMembers: GetMembers,
  getSetupStatus: GetSetupStatus,
  getTrackedActors: GetTrackedActors,
  getPreferences: GetPreferences,
  getProfile: GetProfile,
  getProfiles: GetProfiles,
  searchActors: SearchActors,
  searchActorsTypeahead: SearchActorsTypeahead,
  getSubscribers: GetSubscribers,
  getLikes: GetLikes,
  getRepostedBy: GetRepostedBy,
  getFeedGenerators: GetFeedGenerators,
  getPosts: GetPosts,
): RequestHandler => {
  const handlers = [
    getPostThread,
    searchPosts,
    getActorLikes,
    getAuthorFeed,
    getTimeline,
    getListFeed,
    getFollows,
    getFollowers,
    getList,
    getLists,
    getUnreadCount,
    listNotifications,
    updateSeen,
    getSubscriptionStatus,
    subscribeServer,
    unsubscribeServer,
    createInviteCode,
    deleteInviteCode,
    getInviteCodes,
    grantAdmin,
    registerAdmin,
    verifyAccess,
    getMembers,
    getSetupStatus,
    getTrackedActors,
    getPreferences,
    getProfile,
    getProfiles,
    searchActors,
    searchActorsTypeahead,
    getSubscribers,
    getLikes,
    getRepostedBy,
    getFeedGenerators,
    getPosts,
  ];

  const router = new LexRouter();
  for (const handler of handlers) {
    handler.handle(router);
  }
  return toRequestListener(router.fetch);
};
