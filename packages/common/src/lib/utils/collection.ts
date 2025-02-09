import type { AppBskyActorProfile, AppBskyFeedPost } from "@dawn/client";

export type SupportedCollectionMap = {
  "app.bsky.actor.profile": AppBskyActorProfile.Record;
  "app.bsky.feed.post": AppBskyFeedPost.Record;
};

export type SupportedCollection = keyof SupportedCollectionMap;
