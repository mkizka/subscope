import type { Did } from "@atproto/did";

import type { Post } from "./post/post.js";
import type { Repost } from "./repost.js";

export type FeedType = "post" | "repost";

type FeedItemParams = {
  uri: string;
  cid: string;
  type: FeedType;
  subjectUri: string | null;
  actorDid: Did;
  sortAt: Date;
};

export class FeedItem {
  readonly uri: string;
  readonly cid: string;
  readonly type: FeedType;
  readonly subjectUri: string | null;
  readonly actorDid: Did;
  readonly sortAt: Date;

  constructor(params: FeedItemParams) {
    this.uri = params.uri;
    this.cid = params.cid;
    this.type = params.type;
    this.subjectUri = params.subjectUri;
    this.actorDid = params.actorDid;
    this.sortAt = params.sortAt;
  }

  static fromPost(post: Post): FeedItem {
    return new FeedItem({
      uri: post.uri.toString(),
      cid: post.cid,
      type: "post",
      subjectUri: null,
      actorDid: post.actorDid,
      sortAt: post.createdAt, // TODO: sortAtに修正
    });
  }

  static fromRepost(repost: Repost): FeedItem {
    return new FeedItem({
      uri: repost.uri.toString(),
      cid: repost.cid,
      type: "repost",
      subjectUri: repost.subjectUri.toString(),
      actorDid: repost.actorDid,
      sortAt: repost.sortAt,
    });
  }
}
