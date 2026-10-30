import { asDid } from "@atproto/did";
import { asHandle } from "../../utils/handle.js";
export class ProfileDetailed {
  actorDid;
  handle;
  avatarCid;
  bannerCid;
  description;
  displayName;
  createdAt;
  indexedAt;
  status;
  constructor(params) {
    this.actorDid = asDid(params.actorDid);
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
