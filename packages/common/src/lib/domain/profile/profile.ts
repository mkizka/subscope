import { type Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

type Avatar = {
  readonly cid: string;
  readonly mimeType: string;
  readonly size: number;
};

export type ProfileParams = {
  uri: AtUri;
  cid: string;
  actorDid: Did;
  avatar: Avatar | null;
  description: string | null;
  displayName: string | null;
  createdAt: Date | null;
  indexedAt?: Date | null; // DBが作るデータなのでオプショナル
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
    this.uri = params.uri;
    this.cid = params.cid;
    this.actorDid = params.actorDid;
    this.avatar = params.avatar;
    this.description = params.description;
    this.displayName = params.displayName;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt ?? null;
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
