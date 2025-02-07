import { asDid, type Did } from "@atproto/did";
import { jsonToLex } from "@atproto/lexicon";
import { AtUri } from "@atproto/syntax";
import type { AppBskyFeedPost } from "@dawn/client";
import client from "@dawn/client";

import type { Record } from "../record.js";
type PostParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  text: string;
  langs: string[] | null;
  createdAt: Date;
};

function assertRecord(json: unknown): asserts json is AppBskyFeedPost.Record {
  client.lexicons.assertValidRecord("app.bsky.feed.post", jsonToLex(json));
}

export class Post {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly text: string;
  readonly langs: string[] | null;
  readonly createdAt: Date;

  constructor(params: PostParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.text = params.text;
    this.langs = params.langs;
    this.createdAt = params.createdAt;
  }

  static from(record: Record) {
    assertRecord(record.json);
    return new Post({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      text: record.json.text,
      langs: record.json.langs ?? [],
      createdAt: new Date(record.json.createdAt),
    });
  }
}
