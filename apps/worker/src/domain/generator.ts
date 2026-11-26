import type { Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export class Generator {
  readonly uri: string;
  readonly cid: string;
  readonly accountDid: Did;
  readonly did: string;
  readonly displayName: string;
  readonly description: string | undefined;
  readonly avatarCid: string | undefined;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  private constructor(params: {
    uri: string;
    cid: string;
    accountDid: Did;
    did: string;
    displayName: string;
    description: string | undefined;
    avatarCid: string | undefined;
    createdAt: Date;
    indexedAt: Date;
  }) {
    this.uri = params.uri;
    this.cid = params.cid;
    this.accountDid = params.accountDid;
    this.did = params.did;
    this.displayName = params.displayName;
    this.description = params.description;
    this.avatarCid = params.avatarCid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  static fromRecord(record: Record) {
    const parsed = validateRecord("app.bsky.feed.generator", record);
    return new Generator({
      uri: record.uri.toString(),
      cid: record.cid,
      accountDid: record.uri.did,
      did: parsed.did,
      displayName: parsed.displayName,
      description: parsed.description,
      avatarCid: getBlobCidString(parsed.avatar),
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}
