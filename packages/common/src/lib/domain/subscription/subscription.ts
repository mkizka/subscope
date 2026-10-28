import { asDid, type Did } from "@atproto/did";

export class Subscription {
  readonly actorDid: Did;
  readonly inviteCode: string | null;
  readonly seenAt: Date | null;
  readonly createdAt: Date;

  constructor(params: {
    actorDid: string;
    inviteCode?: string | null;
    seenAt?: Date | null;
    createdAt: Date;
  }) {
    this.actorDid = asDid(params.actorDid);
    this.inviteCode = params.inviteCode ?? null;
    this.seenAt = params.seenAt ?? null;
    this.createdAt = params.createdAt;
  }
}
