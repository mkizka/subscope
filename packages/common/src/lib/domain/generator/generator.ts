import { asDid, type Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";

import { validateRecord } from "../../utils/record.js";
import type { Record } from "../record/record.js";

export type GeneratorParams = {
  uri: AtUri | string;
  cid: string;
  accountDid: string;
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
  readonly accountDid: Did;
  readonly did: Did;
  readonly displayName: string;
  readonly description?: string;
  readonly avatarCid?: string;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  constructor(params: GeneratorParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.accountDid = asDid(params.accountDid);
    this.did = asDid(params.did);
    this.displayName = params.displayName;
    this.description = params.description;
    this.avatarCid = params.avatarCid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  static from(record: Record) {
    const parsed = validateRecord("app.bsky.feed.generator", record);
    return new Generator({
      uri: record.uri,
      cid: record.cid,
      accountDid: record.uri.host,
      did: parsed.did,
      displayName: parsed.displayName,
      description: parsed.description,
      avatarCid: getBlobCidString(parsed.avatar),
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}
