import type { InferOutput } from "@atproto/lex";
import profile from "@repo/client/lex/app/bsky/actor/profile";
import generator from "@repo/client/lex/app/bsky/feed/generator";
import like from "@repo/client/lex/app/bsky/feed/like";
import post from "@repo/client/lex/app/bsky/feed/post";
import postgate from "@repo/client/lex/app/bsky/feed/postgate";
import repost from "@repo/client/lex/app/bsky/feed/repost";
import threadgate from "@repo/client/lex/app/bsky/feed/threadgate";
import follow from "@repo/client/lex/app/bsky/graph/follow";
import list from "@repo/client/lex/app/bsky/graph/list";
import listitem from "@repo/client/lex/app/bsky/graph/listitem";

export const SUPPORTED_COLLECTION_SCHEMAS = {
  "app.bsky.actor.profile": profile,
  "app.bsky.feed.generator": generator,
  "app.bsky.feed.like": like,
  "app.bsky.feed.post": post,
  "app.bsky.feed.postgate": postgate,
  "app.bsky.feed.repost": repost,
  "app.bsky.feed.threadgate": threadgate,
  "app.bsky.graph.follow": follow,
  "app.bsky.graph.list": list,
  "app.bsky.graph.listitem": listitem,
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
