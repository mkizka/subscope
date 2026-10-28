import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Record } from "../record/record.js";

export type ListItemParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  listUri: AtUri | string;
  subjectDid: string;
  createdAt: Date;
  indexedAt: Date;
};

export class ListItem {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly listUri: AtUri;
  readonly subjectDid: Did;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  constructor(params: ListItemParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.listUri = new AtUri(params.listUri.toString());
    this.subjectDid = asDid(params.subjectDid);
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  static from(record: Record) {
    const parsed = record.validate("app.bsky.graph.listitem");
    return new ListItem({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      listUri: parsed.list,
      subjectDid: parsed.subject,
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}
