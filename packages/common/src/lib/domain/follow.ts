import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Record } from "./record.js";

type FollowParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  subjectDid: string;
  createdAt: Date;
};

export class Follow {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly subjectDid: Did;
  readonly createdAt: Date;

  constructor(params: FollowParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.subjectDid = asDid(params.subjectDid);
    this.createdAt = params.createdAt;
  }

  static from(record: Record) {
    const parsed = record.validate("app.bsky.graph.follow");
    return new Follow({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      subjectDid: parsed.subject,
      createdAt: new Date(parsed.createdAt),
    });
  }
}
