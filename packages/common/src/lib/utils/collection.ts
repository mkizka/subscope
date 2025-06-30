import type {
  AppBskyActorProfile,
  AppBskyFeedGenerator,
  AppBskyFeedLike,
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyGraphFollow,
  DevMkizkaTestSubscription,
} from "@repo/client/server";

export type SupportedCollectionMap = {
  "app.bsky.actor.profile": AppBskyActorProfile.Record;
  "app.bsky.feed.generator": AppBskyFeedGenerator.Record;
  "app.bsky.feed.like": AppBskyFeedLike.Record;
  "app.bsky.feed.post": AppBskyFeedPost.Record;
  "app.bsky.feed.repost": AppBskyFeedRepost.Record;
  "app.bsky.graph.follow": AppBskyGraphFollow.Record;
  "dev.mkizka.test.subscription": DevMkizkaTestSubscription.Record;
};

export type SupportedCollection = keyof SupportedCollectionMap;

export const SUPPORTED_COLLECTIONS = [
  "app.bsky.actor.profile",
  "app.bsky.feed.generator",
  "app.bsky.feed.like",
  "app.bsky.feed.post",
  "app.bsky.feed.repost",
  "app.bsky.graph.follow",
  "dev.mkizka.test.subscription",
] as const satisfies SupportedCollection[];

export const isSupportedCollection = (
  collection: string,
): collection is SupportedCollection => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return SUPPORTED_COLLECTIONS.includes(collection as SupportedCollection);
};

export const asSupportedCollection = (
  collection: string,
): SupportedCollection => {
  if (isSupportedCollection(collection)) {
    return collection;
  }
  throw new Error(`Unsupported collection: ${collection}`);
};
