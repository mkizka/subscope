import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Record } from "../record/record.js";

export type ProfileParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
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
  readonly actorDid: Did;
  readonly avatarCid: string | null;
  readonly bannerCid: string | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly createdAt: Date | null;
  readonly indexedAt: Date;

  constructor(params: ProfileParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.avatarCid = params.avatarCid ?? null;
    this.bannerCid = params.bannerCid ?? null;
    this.description = params.description ?? null;
    this.displayName = params.displayName ?? null;
    this.createdAt = params.createdAt ? new Date(params.createdAt) : null;
    this.indexedAt = new Date(params.indexedAt);
  }

  static from(record: Record) {
    const parsed = record.validate("app.bsky.actor.profile");
    return new Profile({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      avatarCid: parsed.avatar?.ref.toString() ?? null,
      bannerCid: parsed.banner?.ref.toString() ?? null,
      description: parsed.description,
      displayName: parsed.displayName,
      createdAt: parsed.createdAt,
      indexedAt: record.indexedAt,
    });
  }
}
