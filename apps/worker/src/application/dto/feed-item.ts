import type { Post } from "./post.js";
import type { Repost } from "./repost.js";
import { getSortAt } from "./sort-at.js";

export type FeedItem = {
  uri: string;
  cid: string;
  type: "post" | "repost";
  subjectUri: string | null;
  accountDid: string;
  sortAt: Date;
};

export function feedItemFromPost(post: Post): FeedItem {
  return {
    uri: post.uri.toString(),
    cid: post.cid,
    type: "post",
    subjectUri: null,
    accountDid: post.accountDid,
    sortAt: getSortAt(post),
  };
}

export function feedItemFromRepost(repost: Repost): FeedItem {
  return {
    uri: repost.uri,
    cid: repost.cid,
    type: "repost",
    subjectUri: repost.subjectUri,
    accountDid: repost.accountDid,
    sortAt: getSortAt(repost),
  };
}
