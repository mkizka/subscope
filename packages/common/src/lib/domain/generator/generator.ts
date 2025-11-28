import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Record } from "../record.js";

export type GeneratorParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  did: string;
  displayName: string;
  description?: string;
  avatarCid?: string;
  createdAt: Date;
  indexedAt: Date;
};

export class Generator {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly did: Did;
  readonly displayName: string;
  readonly description?: string;
  readonly avatarCid?: string;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  constructor(params: GeneratorParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.did = asDid(params.did);
    this.displayName = params.displayName;
    this.description = params.description;
    this.avatarCid = params.avatarCid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  static from(record: Record) {
    const parsed = record.validate("app.bsky.feed.generator");
    return new Generator({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      did: parsed.did,
      displayName: parsed.displayName,
      description: parsed.description,
      avatarCid: parsed.avatar?.ref.toString(),
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}
