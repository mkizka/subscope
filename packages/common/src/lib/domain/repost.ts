import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Record } from "./record.js";

type RepostParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  subjectUri: AtUri | string;
  subjectCid: string;
  createdAt: Date;
  indexedAt: Date;
  sortAt?: Date;
};

export class Repost {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly subjectUri: AtUri;
  readonly subjectCid: string;
  readonly createdAt: Date;
  readonly indexedAt: Date;
  readonly sortAt: Date;

  constructor(params: RepostParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.subjectUri = new AtUri(params.subjectUri.toString());
    this.subjectCid = params.subjectCid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
    this.sortAt = params.sortAt || params.createdAt;
  }

  static from(record: Record) {
    const parsed = record.validate("app.bsky.feed.repost");
    return new Repost({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      subjectUri: parsed.subject.uri,
      subjectCid: parsed.subject.cid,
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}
