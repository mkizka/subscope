import { asDid, type Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { validateRecord } from "@repo/common/utils";
import type { schema } from "@repo/db";

import { getSortAt, type Post } from "./models/post.js";
import type { Record } from "./models/record.js";

type DidFields = { accountDid: Did; subjectDid: Did };

export type FollowRow = typeof schema.follows.$inferInsert & DidFields;
export type LikeRow = typeof schema.likes.$inferInsert;
export type RepostRow = typeof schema.reposts.$inferInsert;
export type ListRow = typeof schema.lists.$inferInsert;
export type ListItemRow = typeof schema.listItems.$inferInsert & DidFields;
export type GeneratorRow = typeof schema.generators.$inferInsert;
export type ProfileRow = typeof schema.profiles.$inferInsert;
export type FeedItemRow = typeof schema.feedItems.$inferInsert;

export const sortAt = (row: { createdAt: Date; indexedAt: Date }) =>
  row.indexedAt < row.createdAt ? row.indexedAt : row.createdAt;

const base = (record: Record) => ({
  uri: record.uri.toString(),
  cid: record.cid,
  accountDid: asDid(record.uri.host),
  indexedAt: record.indexedAt,
});

export function parseFollow(record: Record): FollowRow {
  const parsed = validateRecord("app.bsky.graph.follow", record);
  return {
    ...base(record),
    subjectDid: parsed.subject,
    createdAt: new Date(parsed.createdAt),
  };
}

export function parseLike(record: Record): LikeRow {
  const parsed = validateRecord("app.bsky.feed.like", record);
  return {
    ...base(record),
    subjectUri: parsed.subject.uri,
    subjectCid: parsed.subject.cid,
    createdAt: new Date(parsed.createdAt),
  };
}

export function parseRepost(record: Record): RepostRow {
  const parsed = validateRecord("app.bsky.feed.repost", record);
  return {
    ...base(record),
    subjectUri: parsed.subject.uri,
    subjectCid: parsed.subject.cid,
    createdAt: new Date(parsed.createdAt),
  };
}

export function parseList(record: Record): ListRow {
  const parsed = validateRecord("app.bsky.graph.list", record);
  return {
    ...base(record),
    purpose: parsed.purpose,
    name: parsed.name,
    description: parsed.description,
    avatarCid: getBlobCidString(parsed.avatar),
    createdAt: new Date(parsed.createdAt),
  };
}

export function parseListItem(record: Record): ListItemRow {
  const parsed = validateRecord("app.bsky.graph.listitem", record);
  return {
    ...base(record),
    listUri: parsed.list,
    subjectDid: parsed.subject,
    createdAt: new Date(parsed.createdAt),
  };
}

export function parseGenerator(record: Record): GeneratorRow {
  const parsed = validateRecord("app.bsky.feed.generator", record);
  return {
    ...base(record),
    did: parsed.did,
    displayName: parsed.displayName,
    description: parsed.description,
    avatarCid: getBlobCidString(parsed.avatar),
    createdAt: new Date(parsed.createdAt),
  };
}

export function parseProfile(record: Record): ProfileRow {
  const parsed = validateRecord("app.bsky.actor.profile", record);
  return {
    ...base(record),
    avatarCid: getBlobCidString(parsed.avatar) ?? null,
    bannerCid: getBlobCidString(parsed.banner) ?? null,
    description: parsed.description,
    displayName: parsed.displayName,
    createdAt: parsed.createdAt ? new Date(parsed.createdAt) : null,
  };
}

export function feedItemFromPost(post: Post): FeedItemRow {
  return {
    uri: post.uri.toString(),
    cid: post.cid,
    type: "post",
    subjectUri: null,
    accountDid: post.accountDid,
    sortAt: getSortAt(post),
  };
}

export function feedItemFromRepost(repost: RepostRow): FeedItemRow {
  return {
    uri: repost.uri,
    cid: repost.cid,
    type: "repost",
    subjectUri: repost.subjectUri,
    accountDid: repost.accountDid,
    sortAt: sortAt({
      createdAt: repost.createdAt,
      indexedAt: repost.indexedAt,
    }),
  };
}
