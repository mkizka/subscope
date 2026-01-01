import { asDid, type Did } from "@atproto/did";

export class Subscription {
  readonly actorDid: Did;
  readonly inviteCode: string | null;
  readonly createdAt: Date;

  constructor(params: {
    actorDid: string;
    inviteCode?: string | null;
    createdAt: Date;
  }) {
    this.actorDid = asDid(params.actorDid);
    this.inviteCode = params.inviteCode ?? null;
    this.createdAt = params.createdAt;
  }
}
