import type { Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export class List {
  private constructor(
    readonly uri: string,
    readonly cid: string,
    readonly accountDid: Did,
    readonly purpose: string,
    readonly name: string,
    readonly description: string | undefined,
    readonly avatarCid: string | undefined,
    readonly createdAt: Date,
    readonly indexedAt: Date,
  ) {}

  static fromRecord(record: Record) {
    const parsed = validateRecord("app.bsky.graph.list", record);
    return new List(
      record.uri.toString(),
      record.cid,
      record.uri.did,
      parsed.purpose,
      parsed.name,
      parsed.description,
      getBlobCidString(parsed.avatar),
      new Date(parsed.createdAt),
      record.indexedAt,
    );
  }
}
