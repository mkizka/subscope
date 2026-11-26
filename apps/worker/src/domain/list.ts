import type { Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export class List {
  readonly uri: string;
  readonly cid: string;
  readonly accountDid: Did;
  readonly purpose: string;
  readonly name: string;
  readonly description: string | undefined;
  readonly avatarCid: string | undefined;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  private constructor(params: {
    uri: string;
    cid: string;
    accountDid: Did;
    purpose: string;
    name: string;
    description: string | undefined;
    avatarCid: string | undefined;
    createdAt: Date;
    indexedAt: Date;
  }) {
    this.uri = params.uri;
    this.cid = params.cid;
    this.accountDid = params.accountDid;
    this.purpose = params.purpose;
    this.name = params.name;
    this.description = params.description;
    this.avatarCid = params.avatarCid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  static fromRecord(record: Record) {
    const parsed = validateRecord("app.bsky.graph.list", record);
    return new List({
      uri: record.uri.toString(),
      cid: record.cid,
      accountDid: record.uri.did,
      purpose: parsed.purpose,
      name: parsed.name,
      description: parsed.description,
      avatarCid: getBlobCidString(parsed.avatar),
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}
