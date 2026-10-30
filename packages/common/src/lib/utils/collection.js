import profile from "@repo/client/lex/app/bsky/actor/profile";
import generator from "@repo/client/lex/app/bsky/feed/generator";
import like from "@repo/client/lex/app/bsky/feed/like";
import post from "@repo/client/lex/app/bsky/feed/post";
import repost from "@repo/client/lex/app/bsky/feed/repost";
import follow from "@repo/client/lex/app/bsky/graph/follow";
import list from "@repo/client/lex/app/bsky/graph/list";
import listitem from "@repo/client/lex/app/bsky/graph/listitem";
export const SUPPORTED_COLLECTION_SCHEMAS = {
  "app.bsky.actor.profile": profile,
  "app.bsky.feed.generator": generator,
  "app.bsky.feed.like": like,
  "app.bsky.feed.post": post,
  "app.bsky.feed.repost": repost,
  "app.bsky.graph.follow": follow,
  "app.bsky.graph.list": list,
  "app.bsky.graph.listitem": listitem,
};
export const isSupportedCollection = (collection) => {
  return Object.hasOwn(SUPPORTED_COLLECTION_SCHEMAS, collection);
};
export const asSupportedCollection = (collection) => {
  if (isSupportedCollection(collection)) {
    return collection;
  }
  throw new Error(`Unsupported collection: ${collection}`);
};
