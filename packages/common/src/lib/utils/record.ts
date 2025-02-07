import { jsonToLex } from "@atproto/lexicon";
import type { AppBskyActorProfile, AppBskyFeedPost } from "@dawn/client";
import { lexicons } from "@dawn/client";

type RecordMap = {
  "app.bsky.actor.profile": AppBskyActorProfile.Record;
  "app.bsky.feed.post": AppBskyFeedPost.Record;
};

export const parseRecord = <T extends keyof RecordMap>(
  lexUri: T,
  json: unknown,
) => {
  const value = jsonToLex(json);
  lexicons.assertValidRecord(lexUri, value);
  return value as RecordMap[T];
};
