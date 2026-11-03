import { asDid, type Did } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { AtUri } from "@atproto/syntax";

import { validateRecord } from "../../utils/record.js";
import type { Record } from "../record/record.js";

export type ProfileParams = {
  uri: AtUri | string;
  cid: string;
  accountDid: string;
  avatarCid?: string | null;
  bannerCid?: string | null;
  description?: string | null;
  displayName?: string | null;
  createdAt?: Date | string | null;
  indexedAt: Date | string;
};

export class Profile {
  readonly uri: AtUri;
  readonly cid: string;
  readonly accountDid: Did;
  readonly avatarCid: string | null;
  readonly bannerCid: string | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly createdAt: Date | null;
  readonly indexedAt: Date;

  constructor(params: ProfileParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.accountDid = asDid(params.accountDid);
    this.avatarCid = params.avatarCid ?? null;
    this.bannerCid = params.bannerCid ?? null;
    this.description = params.description ?? null;
    this.displayName = params.displayName ?? null;
    this.createdAt = params.createdAt ? new Date(params.createdAt) : null;
    this.indexedAt = new Date(params.indexedAt);
  }

  static from(record: Record) {
    const parsed = validateRecord("app.bsky.actor.profile", record);
    return new Profile({
      uri: record.uri,
      cid: record.cid,
      accountDid: record.uri.host,
      avatarCid: getBlobCidString(parsed.avatar) ?? null,
      bannerCid: getBlobCidString(parsed.banner) ?? null,
      description: parsed.description,
      displayName: parsed.displayName,
      createdAt: parsed.createdAt,
      indexedAt: record.indexedAt,
    });
  }
}
