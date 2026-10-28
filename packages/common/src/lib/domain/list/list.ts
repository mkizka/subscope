import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Record } from "../record/record.js";

export type ListParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  purpose: string;
  name: string;
  description?: string;
  avatarCid?: string;
  createdAt: Date;
  indexedAt: Date;
};

export class List {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly purpose: string;
  readonly name: string;
  readonly description?: string;
  readonly avatarCid?: string;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  constructor(params: ListParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.purpose = params.purpose;
    this.name = params.name;
    this.description = params.description;
    this.avatarCid = params.avatarCid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  static from(record: Record) {
    const parsed = record.validate("app.bsky.graph.list");
    return new List({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      purpose: parsed.purpose,
      name: parsed.name,
      description: parsed.description,
      avatarCid: parsed.avatar?.ref.toString(),
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}
