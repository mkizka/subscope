import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Record } from "./record.js";

type LikeParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  subjectUri: AtUri | string;
  subjectCid: string;
  createdAt: Date;
};

export class Like {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly subjectUri: AtUri;
  readonly subjectCid: string;
  readonly createdAt: Date;

  constructor(params: LikeParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.subjectUri = new AtUri(params.subjectUri.toString());
    this.subjectCid = params.subjectCid;
    this.createdAt = params.createdAt;
  }

  static from(record: Record) {
    const parsed = record.validate("app.bsky.feed.like");
    return new Like({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      subjectUri: parsed.subject.uri,
      subjectCid: parsed.subject.cid,
      createdAt: new Date(parsed.createdAt),
    });
  }
}
