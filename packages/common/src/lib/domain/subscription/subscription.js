import { asDid } from "@atproto/did";
export class Subscription {
  actorDid;
  inviteCode;
  seenAt;
  createdAt;
  constructor(params) {
    this.actorDid = asDid(params.actorDid);
    this.inviteCode = params.inviteCode ?? null;
    this.seenAt = params.seenAt ?? null;
    this.createdAt = params.createdAt;
  }
}
