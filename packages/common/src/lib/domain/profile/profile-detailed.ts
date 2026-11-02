import { asDid, type Did } from "@atproto/did";

import type { Handle } from "../../utils/handle.js";
import { asHandle } from "../../utils/handle.js";
import type { AccountStatus } from "../account/account.js";

export type ProfileDetailedParams = {
  accountDid: string;
  handle: string | null;
  avatarCid?: string | null;
  bannerCid?: string | null;
  description?: string | null;
  displayName?: string | null;
  createdAt?: Date | string | null;
  indexedAt: Date | string;
  status?: AccountStatus;
};

export class ProfileDetailed {
  readonly accountDid: Did;
  readonly handle: Handle | null;
  readonly avatarCid: string | null;
  readonly bannerCid: string | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly createdAt: Date | null;
  readonly indexedAt: Date;
  readonly status: AccountStatus;

  constructor(params: ProfileDetailedParams) {
    this.accountDid = asDid(params.accountDid);
    this.handle = params.handle ? asHandle(params.handle) : null;
    this.avatarCid = params.avatarCid ?? null;
    this.bannerCid = params.bannerCid ?? null;
    this.description = params.description ?? null;
    this.displayName = params.displayName ?? null;
    this.createdAt = params.createdAt ? new Date(params.createdAt) : null;
    this.indexedAt = new Date(params.indexedAt);
    this.status = params.status ?? "active";
  }
}
