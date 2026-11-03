import { asDid, type Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";

import { validateRecord } from "../../utils/record.js";
import type { Record } from "../record/record.js";

type ListParams = {
  uri: AtUri | string;
  cid: string;
  accountDid: string;
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
  readonly accountDid: Did;
  readonly purpose: string;
  readonly name: string;
  readonly description?: string;
  readonly avatarCid?: string;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  constructor(params: ListParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.accountDid = asDid(params.accountDid);
    this.purpose = params.purpose;
    this.name = params.name;
    this.description = params.description;
    this.avatarCid = params.avatarCid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  static from(record: Record) {
    const parsed = validateRecord("app.bsky.graph.list", record);
    return new List({
      uri: record.uri,
      cid: record.cid,
      accountDid: record.uri.host,
      purpose: parsed.purpose,
      name: parsed.name,
      description: parsed.description,
      avatarCid: getBlobCidString(parsed.avatar),
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}
