import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import { parseRecord } from "../../utils/record.js";
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
  indexedAt?: Date | string | null;
};

export class Profile {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly avatar: Avatar | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly createdAt: Date | null;
  readonly indexedAt: Date | null;

  constructor(params: ProfileParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.avatar = params.avatar ?? null;
    this.description = params.description ?? null;
    this.displayName = params.displayName ?? null;
    this.createdAt = params.createdAt ? new Date(params.createdAt) : null;
    this.indexedAt = params.indexedAt ? new Date(params.indexedAt) : null;
  }

  static from(record: Record) {
    const parsed = parseRecord("app.bsky.actor.profile", record.json);
    return new Profile({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      avatar: parsed.avatar
        ? {
            cid: parsed.avatar.ref.toString(),
            mimeType: parsed.avatar.mimeType,
            size: parsed.avatar.size,
          }
        : null,
      description: parsed.description ?? null,
      displayName: parsed.displayName ?? null,
      createdAt: parsed.createdAt,
      indexedAt: null,
    });
  }

  getAvatarUrl(): string | null {
    if (!this.avatar) {
      return null;
    }
    const [type, subtype] = this.avatar.mimeType.split("/");
    if (type !== "image" || !subtype) {
      return null;
    }
    // TODO: 自作実装に置き換える
    return `https://cdn.bsky.app/img/avatar/plain/${this.actorDid}/${this.avatar.cid}@${subtype}`;
  }

  toJSON() {
    return {
      did: this.actorDid,
      avatar: this.getAvatarUrl() ?? undefined,
      description: this.description ?? undefined,
      displayName: this.displayName ?? undefined,
      createdAt: this.createdAt?.toISOString(),
      indexedAt: this.indexedAt?.toISOString(),
    };
  }
}
