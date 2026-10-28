import type { InferOutput } from "@atproto/lex";
import { app } from "@repo/client/lex";

export const SUPPORTED_COLLECTION_SCHEMAS = {
  "app.bsky.actor.profile": app.bsky.actor.profile.main,
  "app.bsky.feed.generator": app.bsky.feed.generator.main,
  "app.bsky.feed.like": app.bsky.feed.like.main,
  "app.bsky.feed.post": app.bsky.feed.post.main,
  "app.bsky.feed.repost": app.bsky.feed.repost.main,
  "app.bsky.graph.follow": app.bsky.graph.follow.main,
  "app.bsky.graph.list": app.bsky.graph.list.main,
  "app.bsky.graph.listitem": app.bsky.graph.listitem.main,
};

type SupportedCollectionSchemas = typeof SUPPORTED_COLLECTION_SCHEMAS;

export type SupportedCollection = keyof SupportedCollectionSchemas;

export type SupportedCollectionMap = {
  [K in SupportedCollection]: InferOutput<SupportedCollectionSchemas[K]>;
};

export const isSupportedCollection = (
  collection: string,
): collection is SupportedCollection => {
  return Object.hasOwn(SUPPORTED_COLLECTION_SCHEMAS, collection);
};

export const asSupportedCollection = (
  collection: string,
): SupportedCollection => {
  if (isSupportedCollection(collection)) {
    return collection;
  }
  throw new Error(`Unsupported collection: ${collection}`);
};
