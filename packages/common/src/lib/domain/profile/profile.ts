import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Record } from "../record.js";

type Avatar = {
  readonly cid: string;
  readonly mimeType: string;
  readonly size: number;
};

export type ProfileParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  avatar?: Avatar | null;
  description?: string | null;
  displayName?: string | null;
  createdAt?: Date | string | null;
  indexedAt: Date | string;
};

export class Profile {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly avatar: Avatar | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly createdAt: Date | null;
  readonly indexedAt: Date;

  constructor(params: ProfileParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.avatar = params.avatar ?? null;
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
      avatar: parsed.avatar && {
        cid: parsed.avatar.ref.toString(),
        mimeType: parsed.avatar.mimeType,
        size: parsed.avatar.size,
      },
      description: parsed.description,
      displayName: parsed.displayName,
      createdAt: parsed.createdAt,
      indexedAt: record.indexedAt,
    });
  }
}
