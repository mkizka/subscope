import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { validateRecord } from "@repo/common/utils";

import { type Follow, parseFollow } from "./follow.js";
import { type Generator, parseGenerator } from "./generator.js";
import { type Like, parseLike } from "./like.js";
import { type List, parseList } from "./list.js";
import { type ListItem, parseListItem } from "./list-item.js";
import { parsePost, type Post } from "./post.js";
import { parseProfile, type Profile } from "./profile.js";
import type { Record } from "./record.js";
import { parseRepost, type Repost } from "./repost.js";

export type ParsedRecord =
  | { collection: "app.bsky.feed.post"; post: Post; mentionDids: Did[] }
  | { collection: "app.bsky.feed.repost"; repost: Repost }
  | { collection: "app.bsky.feed.like"; like: Like }
  | { collection: "app.bsky.graph.follow"; follow: Follow }
  | { collection: "app.bsky.graph.listitem"; listItem: ListItem }
  | { collection: "app.bsky.actor.profile"; profile: Profile }
  | { collection: "app.bsky.feed.generator"; generator: Generator }
  | { collection: "app.bsky.graph.list"; list: List }
  | { collection: "app.bsky.actor.link" }
  | {
      collection: "app.bsky.feed.threadgate" | "app.bsky.feed.postgate";
      postUri: AtUri;
    };

export function parseRecord(record: Record): ParsedRecord {
  const collection = record.uri.collection;
  switch (collection) {
    case "app.bsky.feed.post":
      return { collection, ...parsePost(record) };
    case "app.bsky.feed.repost":
      return { collection, repost: parseRepost(record) };
    case "app.bsky.feed.like":
      return { collection, like: parseLike(record) };
    case "app.bsky.graph.follow":
      return { collection, follow: parseFollow(record) };
    case "app.bsky.graph.listitem":
      return { collection, listItem: parseListItem(record) };
    case "app.bsky.actor.profile":
      return { collection, profile: parseProfile(record) };
    case "app.bsky.feed.generator":
      return { collection, generator: parseGenerator(record) };
    case "app.bsky.graph.list":
      return { collection, list: parseList(record) };
    case "app.bsky.actor.link":
      validateRecord(collection, record);
      return { collection };
    case "app.bsky.feed.threadgate":
    case "app.bsky.feed.postgate":
      return {
        collection,
        postUri: new AtUri(validateRecord(collection, record).post),
      };
    default:
      throw new Error(`Unsupported collection: ${collection}`);
  }
}
