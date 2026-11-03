import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Repost } from "../repost/repost.js";

export type FeedType = "post" | "repost";

export type FeedItemParams = {
  uri: AtUri | string;
  cid: string;
  type: FeedType;
  subjectUri: string | null;
  accountDid: Did;
  sortAt: Date;
};

export class FeedItem {
  readonly uri: AtUri;
  readonly cid: string;
  readonly type: FeedType;
  readonly subjectUri: string | null;
  readonly accountDid: Did;
  readonly sortAt: Date;

  constructor(params: FeedItemParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.type = params.type;
    this.subjectUri = params.subjectUri;
    this.accountDid = params.accountDid;
    this.sortAt = params.sortAt;
  }

  static fromRepost(repost: Repost): FeedItem {
    return new FeedItem({
      uri: repost.uri,
      cid: repost.cid,
      type: "repost",
      subjectUri: repost.subjectUri.toString(),
      accountDid: repost.accountDid,
      sortAt: repost.sortAt,
    });
  }
}
