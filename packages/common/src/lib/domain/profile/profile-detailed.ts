import { asDid, type Did } from "@atproto/did";

import type { Handle } from "../../utils/handle.js";
import { asHandle } from "../../utils/handle.js";

export type ProfileDetailedParams = {
  actorDid: string;
  handle: string | null;
  avatarCid?: string | null;
  bannerCid?: string | null;
  description?: string | null;
  displayName?: string | null;
  createdAt?: Date | string | null;
  indexedAt: Date | string;
};

export class ProfileDetailed {
  readonly actorDid: Did;
  readonly handle: Handle | null;
  readonly avatarCid: string | null;
  readonly bannerCid: string | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly createdAt: Date | null;
  readonly indexedAt: Date;

  constructor(params: ProfileDetailedParams) {
    this.actorDid = asDid(params.actorDid);
    this.handle = params.handle ? asHandle(params.handle) : null;
    this.avatarCid = params.avatarCid ?? null;
    this.bannerCid = params.bannerCid ?? null;
    this.description = params.description ?? null;
    this.displayName = params.displayName ?? null;
    this.createdAt = params.createdAt ? new Date(params.createdAt) : null;
    this.indexedAt = new Date(params.indexedAt);
  }
}
