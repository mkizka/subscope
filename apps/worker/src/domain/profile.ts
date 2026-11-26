import type { Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export class Profile {
  private constructor(
    readonly uri: string,
    readonly cid: string,
    readonly accountDid: Did,
    readonly avatarCid: string | null,
    readonly bannerCid: string | null,
    readonly description: string | undefined,
    readonly displayName: string | undefined,
    readonly createdAt: Date | null,
    readonly indexedAt: Date,
    readonly pinnedPostUri: string | null,
  ) {}

  static fromRecord(record: Record) {
    const parsed = validateRecord("app.bsky.actor.profile", record);
    return new Profile(
      record.uri.toString(),
      record.cid,
      record.uri.did,
      getBlobCidString(parsed.avatar) ?? null,
      getBlobCidString(parsed.banner) ?? null,
      parsed.description,
      parsed.displayName,
      parsed.createdAt ? new Date(parsed.createdAt) : null,
      record.indexedAt,
      parsed.pinnedPost?.uri ?? null,
    );
  }

  get pinnedPost() {
    return this.pinnedPostUri ? new AtUri(this.pinnedPostUri) : null;
  }
}
