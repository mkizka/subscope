import type { Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export class Generator {
  private constructor(
    readonly uri: string,
    readonly cid: string,
    readonly accountDid: Did,
    readonly did: string,
    readonly displayName: string,
    readonly description: string | undefined,
    readonly avatarCid: string | undefined,
    readonly createdAt: Date,
    readonly indexedAt: Date,
  ) {}

  static fromRecord(record: Record) {
    const parsed = validateRecord("app.bsky.feed.generator", record);
    return new Generator(
      record.uri.toString(),
      record.cid,
      record.uri.did,
      parsed.did,
      parsed.displayName,
      parsed.description,
      getBlobCidString(parsed.avatar),
      new Date(parsed.createdAt),
      record.indexedAt,
    );
  }
}
