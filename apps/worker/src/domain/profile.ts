import type { Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export class Profile {
  readonly uri: string;
  readonly cid: string;
  readonly accountDid: Did;
  readonly avatarCid: string | null;
  readonly bannerCid: string | null;
  readonly description: string | undefined;
  readonly displayName: string | undefined;
  readonly createdAt: Date | null;
  readonly indexedAt: Date;
  readonly pinnedPostUri: string | null;

  private constructor(params: {
    uri: string;
    cid: string;
    accountDid: Did;
    avatarCid: string | null;
    bannerCid: string | null;
    description: string | undefined;
    displayName: string | undefined;
    createdAt: Date | null;
    indexedAt: Date;
    pinnedPostUri: string | null;
  }) {
    this.uri = params.uri;
    this.cid = params.cid;
    this.accountDid = params.accountDid;
    this.avatarCid = params.avatarCid;
    this.bannerCid = params.bannerCid;
    this.description = params.description;
    this.displayName = params.displayName;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
    this.pinnedPostUri = params.pinnedPostUri;
  }

  static fromRecord(record: Record) {
    const parsed = validateRecord("app.bsky.actor.profile", record);
    return new Profile({
      uri: record.uri.toString(),
      cid: record.cid,
      accountDid: record.uri.did,
      avatarCid: getBlobCidString(parsed.avatar) ?? null,
      bannerCid: getBlobCidString(parsed.banner) ?? null,
      description: parsed.description,
      displayName: parsed.displayName,
      createdAt: parsed.createdAt ? new Date(parsed.createdAt) : null,
      indexedAt: record.indexedAt,
      pinnedPostUri: parsed.pinnedPost?.uri ?? null,
    });
  }

  get pinnedPost() {
    return this.pinnedPostUri ? new AtUri(this.pinnedPostUri) : null;
  }
}
