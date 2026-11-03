import type { Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import type { Post, Record } from "@repo/common/domain";
import type { schema } from "@repo/db";

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
  accountDid: record.accountDid,
  indexedAt: record.indexedAt,
});

export function parseFollow(record: Record): FollowRow {
  const parsed = record.validate("app.bsky.graph.follow");
  return {
    ...base(record),
    subjectDid: parsed.subject,
    createdAt: new Date(parsed.createdAt),
  };
}

export function parseLike(record: Record): LikeRow {
  const parsed = record.validate("app.bsky.feed.like");
  return {
    ...base(record),
    subjectUri: parsed.subject.uri,
    subjectCid: parsed.subject.cid,
    createdAt: new Date(parsed.createdAt),
  };
}

export function parseRepost(record: Record): RepostRow {
  const parsed = record.validate("app.bsky.feed.repost");
  return {
    ...base(record),
    subjectUri: parsed.subject.uri,
    subjectCid: parsed.subject.cid,
    createdAt: new Date(parsed.createdAt),
  };
}

export function parseList(record: Record): ListRow {
  const parsed = record.validate("app.bsky.graph.list");
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
  const parsed = record.validate("app.bsky.graph.listitem");
  return {
    ...base(record),
    listUri: parsed.list,
    subjectDid: parsed.subject,
    createdAt: new Date(parsed.createdAt),
  };
}

export function parseGenerator(record: Record): GeneratorRow {
  const parsed = record.validate("app.bsky.feed.generator");
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
  const parsed = record.validate("app.bsky.actor.profile");
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
    sortAt: post.sortAt,
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
