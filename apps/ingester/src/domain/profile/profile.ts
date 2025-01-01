import { asDid, type Did } from "@atproto/did";

type Avatar = {
  readonly cid: string;
  readonly mimeType: string;
  readonly size: number;
};

export type ProfileParams = {
  did: string;
  avatar: Avatar | null;
  description: string | null;
  displayName: string | null;
  createdAt: string | Date | null;
  indexedAt?: string | Date | null; // DBが作るデータなのでオプショナル
};

export class Profile {
  readonly did: Did;
  readonly avatar: Avatar | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly createdAt: Date | null;
  readonly indexedAt: Date | null;

  constructor(params: ProfileParams) {
    this.did = asDid(params.did);
    this.avatar = params.avatar;
    this.description = params.description;
    this.displayName = params.displayName;
    this.createdAt = params.createdAt ? new Date(params.createdAt) : null;
    this.indexedAt = params.indexedAt ? new Date(params.indexedAt) : null;
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
    return `https://cdn.bsky.app/img/avatar/plain/${this.did}/${this.avatar.cid}@${subtype}`;
  }
}
