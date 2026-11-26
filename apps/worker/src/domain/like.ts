import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { validateRecord } from "@repo/common/utils";

import type { Notification } from "./notification.js";
import type { Record } from "./record.js";
import { getSortAt } from "./sort-at.js";

export class Like {
  readonly uri: string;
  readonly cid: string;
  readonly accountDid: Did;
  readonly subjectUri: string;
  readonly subjectCid: string;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  private constructor(params: {
    uri: string;
    cid: string;
    accountDid: Did;
    subjectUri: string;
    subjectCid: string;
    createdAt: Date;
    indexedAt: Date;
  }) {
    this.uri = params.uri;
    this.cid = params.cid;
    this.accountDid = params.accountDid;
    this.subjectUri = params.subjectUri;
    this.subjectCid = params.subjectCid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  static fromRecord(record: Record) {
    const parsed = validateRecord("app.bsky.feed.like", record);
    return new Like({
      uri: record.uri.toString(),
      cid: record.cid,
      accountDid: record.uri.did,
      subjectUri: parsed.subject.uri,
      subjectCid: parsed.subject.cid,
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }

  get subject() {
    return new AtUri(this.subjectUri);
  }

  get subjectAuthorDid() {
    return this.subject.host;
  }

  get likesPost() {
    return this.subject.collection === "app.bsky.feed.post";
  }

  get notification(): Notification {
    return {
      recordUri: this.uri,
      recipientDid: this.subjectAuthorDid,
      authorDid: this.accountDid,
      reason: "like",
      reasonSubject: this.subjectUri,
      sortAt: getSortAt(this),
    };
  }
}
