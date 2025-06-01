import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import type { Record } from "./record.js";

type SubscriptionParams = {
  uri: AtUri | string;
  cid: string;
  actorDid: string;
  appviewDid: string;
  createdAt: Date;
};

export class Subscription {
  readonly uri: AtUri;
  readonly cid: string;
  readonly actorDid: Did;
  readonly appviewDid: Did;
  readonly createdAt: Date;

  constructor(params: SubscriptionParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.actorDid = asDid(params.actorDid);
    this.appviewDid = asDid(params.appviewDid);
    this.createdAt = params.createdAt;
  }

  static from(record: Record) {
    const parsed = record.validate("dev.mkizka.test.subscription");
    return new Subscription({
      uri: record.uri,
      cid: record.cid,
      actorDid: record.actorDid,
      appviewDid: parsed.appviewDid,
      createdAt: new Date(parsed.createdAt),
    });
  }
}
