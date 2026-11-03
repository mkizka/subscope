import { asDid, type Did } from "@atproto/did";

export class Registration {
  readonly accountDid: Did;
  readonly inviteCode: string | null;
  readonly seenAt: Date | null;
  readonly createdAt: Date;

  constructor(params: {
    accountDid: string;
    inviteCode?: string | null;
    seenAt?: Date | null;
    createdAt: Date;
  }) {
    this.accountDid = asDid(params.accountDid);
    this.inviteCode = params.inviteCode ?? null;
    this.seenAt = params.seenAt ?? null;
    this.createdAt = params.createdAt;
  }
}
