import type { AppBskyActorProfile, AppBskyFeedPost } from "@dawn/client";

export type SupportedCollectionMap = {
  "app.bsky.actor.profile": AppBskyActorProfile.Record;
  "app.bsky.feed.post": AppBskyFeedPost.Record;
};

export type SupportedCollection = keyof SupportedCollectionMap;

const SUPPORTED_COLLECTION = [
  "app.bsky.actor.profile",
  "app.bsky.feed.post",
] as const satisfies SupportedCollection[];

const isSupportedCollection = (
  collection: string,
): collection is SupportedCollection => {
  return SUPPORTED_COLLECTION.includes(collection as SupportedCollection);
};

export const asSupportedCollection = (collection: string) => {
  if (!isSupportedCollection(collection)) {
    throw new Error(`Unsupported collection: ${collection}`);
  }
  return collection;
};
