import type { AppBskyActorProfile, AppBskyFeedPost } from "@dawn/client";

export type SupportedCollectionMap = {
  "app.bsky.actor.profile": AppBskyActorProfile.Record;
  "app.bsky.feed.post": AppBskyFeedPost.Record;
};

export type SupportedCollection = keyof SupportedCollectionMap;

export const SUPPORTED_COLLECTIONS = [
  "app.bsky.actor.profile",
  "app.bsky.feed.post",
] as const satisfies SupportedCollection[];

export const isSupportedCollection = (
  collection: string,
): collection is SupportedCollection => {
  return SUPPORTED_COLLECTIONS.includes(collection as SupportedCollection);
};
