import type { InferOutput } from "@atproto/lex";
import link from "@repo/client/app/bsky/actor/link";
import profile from "@repo/client/app/bsky/actor/profile";
import generator from "@repo/client/app/bsky/feed/generator";
import like from "@repo/client/app/bsky/feed/like";
import post from "@repo/client/app/bsky/feed/post";
import postgate from "@repo/client/app/bsky/feed/postgate";
import repost from "@repo/client/app/bsky/feed/repost";
import threadgate from "@repo/client/app/bsky/feed/threadgate";
import block from "@repo/client/app/bsky/graph/block";
import follow from "@repo/client/app/bsky/graph/follow";
import list from "@repo/client/app/bsky/graph/list";
import listitem from "@repo/client/app/bsky/graph/listitem";

export const SUPPORTED_COLLECTION_SCHEMAS = {
  "app.bsky.actor.link": link,
  "app.bsky.actor.profile": profile,
  "app.bsky.feed.generator": generator,
  "app.bsky.feed.like": like,
  "app.bsky.feed.post": post,
  "app.bsky.feed.postgate": postgate,
  "app.bsky.feed.repost": repost,
  "app.bsky.feed.threadgate": threadgate,
  "app.bsky.graph.block": block,
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
