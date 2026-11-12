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
import type { SearchPostsV2 } from "./app/bsky/feed/searchPostsV2.js";
import type { GetFollowers } from "./app/bsky/graph/getFollowers.js";
import type { GetFollows } from "./app/bsky/graph/getFollows.js";
import type { GetKnownFollowers } from "./app/bsky/graph/getKnownFollowers.js";
import type { GetList } from "./app/bsky/graph/getList.js";
import type { GetLists } from "./app/bsky/graph/getLists.js";
import type { GetListsWithMembership } from "./app/bsky/graph/getListsWithMembership.js";
import type { GetGroupedNotifications } from "./app/bsky/notification/getGroupedNotifications.js";
import type { GetUnreadCount } from "./app/bsky/notification/getUnreadCount.js";
import type { ListNotifications } from "./app/bsky/notification/listNotifications.js";
import type { UpdateSeen } from "./app/bsky/notification/updateSeen.js";
import type { GetPostThreadV2 } from "./app/bsky/unspecced/getPostThreadV2.js";
import type { BanAccount } from "./me/subsco/admin/banAccount.js";
import type { CreateInviteCode } from "./me/subsco/admin/createInviteCode.js";
import type { DeleteInviteCode } from "./me/subsco/admin/deleteInviteCode.js";
import type { GetBannedAccounts } from "./me/subsco/admin/getBannedAccounts.js";
import type { GetInviteCodes } from "./me/subsco/admin/getInviteCodes.js";
import type { GrantAdmin } from "./me/subsco/admin/grantAdmin.js";
import type { ListServerMembers } from "./me/subsco/admin/listServerMembers.js";
import type { RegisterAdmin } from "./me/subsco/admin/registerAdmin.js";
import type { RevokeAdmin } from "./me/subsco/admin/revokeAdmin.js";
import type { UnbanAccount } from "./me/subsco/admin/unbanAccount.js";
import type { VerifyAccess } from "./me/subsco/admin/verifyAccess.js";
import type { GetServerMemberFollowers } from "./me/subsco/graph/getServerMemberFollowers.js";
import type { GetFollowedAccounts } from "./me/subsco/server/getFollowedAccounts.js";
import type { GetLocalTimeline } from "./me/subsco/server/getLocalTimeline.js";
import type { GetOperator } from "./me/subsco/server/getOperator.js";
import type { GetServerMembers } from "./me/subsco/server/getServerMembers.js";
import type { GetSetupStatus } from "./me/subsco/server/getSetupStatus.js";
import type { GetBackfillStatuses } from "./me/subsco/sync/getBackfillStatuses.js";
import type { GetRegistrationStatus } from "./me/subsco/sync/getRegistrationStatus.js";
import type { RegisterAccount } from "./me/subsco/sync/registerAccount.js";
import type { UnregisterAccount } from "./me/subsco/sync/unregisterAccount.js";

export const lexRouterFactory = (
  getPostThread: GetPostThread,
  searchPosts: SearchPosts,
  getActorLikes: GetActorLikes,
  getAuthorFeed: GetAuthorFeed,
  getTimeline: GetTimeline,
  getListFeed: GetListFeed,
  getFollows: GetFollows,
  getFollowers: GetFollowers,
  getKnownFollowers: GetKnownFollowers,
  getList: GetList,
  getLists: GetLists,
  getListsWithMembership: GetListsWithMembership,
  getUnreadCount: GetUnreadCount,
  listNotifications: ListNotifications,
  getGroupedNotifications: GetGroupedNotifications,
  updateSeen: UpdateSeen,
  getRegistrationStatus: GetRegistrationStatus,
  getBackfillStatuses: GetBackfillStatuses,
  registerAccount: RegisterAccount,
  unregisterAccount: UnregisterAccount,
  banAccount: BanAccount,
  unbanAccount: UnbanAccount,
  createInviteCode: CreateInviteCode,
  deleteInviteCode: DeleteInviteCode,
  getInviteCodes: GetInviteCodes,
  grantAdmin: GrantAdmin,
  revokeAdmin: RevokeAdmin,
  registerAdmin: RegisterAdmin,
  verifyAccess: VerifyAccess,
  getLocalTimeline: GetLocalTimeline,
  getServerMembers: GetServerMembers,
  getSetupStatus: GetSetupStatus,
  getOperator: GetOperator,
  getFollowedAccounts: GetFollowedAccounts,
  getServerMemberFollowers: GetServerMemberFollowers,
  getPreferences: GetPreferences,
  getProfile: GetProfile,
  getProfiles: GetProfiles,
  searchActors: SearchActors,
  searchActorsTypeahead: SearchActorsTypeahead,
  listServerMembers: ListServerMembers,
  getBannedAccounts: GetBannedAccounts,
  getLikes: GetLikes,
  getRepostedBy: GetRepostedBy,
  getFeedGenerators: GetFeedGenerators,
  getPosts: GetPosts,
  getPostThreadV2: GetPostThreadV2,
  searchPostsV2: SearchPostsV2,
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
    getKnownFollowers,
    getList,
    getLists,
    getListsWithMembership,
    getUnreadCount,
    listNotifications,
    getGroupedNotifications,
    updateSeen,
    getRegistrationStatus,
    getBackfillStatuses,
    registerAccount,
    unregisterAccount,
    banAccount,
    unbanAccount,
    createInviteCode,
    deleteInviteCode,
    getInviteCodes,
    grantAdmin,
    revokeAdmin,
    registerAdmin,
    verifyAccess,
    getLocalTimeline,
    getServerMembers,
    getSetupStatus,
    getOperator,
    getFollowedAccounts,
    getServerMemberFollowers,
    getPreferences,
    getProfile,
    getProfiles,
    searchActors,
    searchActorsTypeahead,
    listServerMembers,
    getBannedAccounts,
    getLikes,
    getRepostedBy,
    getFeedGenerators,
    getPosts,
    getPostThreadV2,
    searchPostsV2,
  ];

  const router = new LexRouter();
  for (const handler of handlers) {
    handler.handle(router);
  }
  return toRequestListener(router.fetch);
};
