import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import { parseRecord } from "../../utils/record.js";
import type { Record } from "../record.js";
type PostParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  text: string;
  langs: string[] | null;
  createdAt: Date;
};

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
    const parsed = parseRecord("app.bsky.feed.post", record.json);
    return new Post({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      text: parsed.text,
      langs: parsed.langs ?? [],
      createdAt: new Date(parsed.createdAt),
    });
  }
}
