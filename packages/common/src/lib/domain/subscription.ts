import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Record } from "./record.js";

type SubscriptionParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  appviewDid: string;
  inviteCode?: string;
  createdAt: Date;
  indexedAt: Date;
};

export class Subscription {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly appviewDid: Did;
  readonly inviteCode?: string;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  constructor(params: SubscriptionParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.appviewDid = asDid(params.appviewDid);
    this.inviteCode = params.inviteCode;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  static from(record: Record) {
    const parsed = record.validate("me.subsco.sync.subscription");
    return new Subscription({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      appviewDid: parsed.appviewDid,
      inviteCode: parsed.inviteCode,
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}
