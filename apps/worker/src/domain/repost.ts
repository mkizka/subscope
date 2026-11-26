import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { validateRecord } from "@repo/common/utils";

import type { FeedItem } from "./feed-item.js";
import type { Notification } from "./notification.js";
import type { Record } from "./record.js";
import { getSortAt } from "./sort-at.js";

export class Repost {
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
    const parsed = validateRecord("app.bsky.feed.repost", record);
    return new Repost({
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

  get feedItem(): FeedItem {
    return {
      uri: this.uri,
      cid: this.cid,
      type: "repost",
      subjectUri: this.subjectUri,
      accountDid: this.accountDid,
      sortAt: getSortAt(this),
    };
  }

  get notification(): Notification {
    return {
      recordUri: this.uri,
      recipientDid: this.subject.host,
      authorDid: this.accountDid,
      reason: "repost",
      reasonSubject: this.subjectUri,
      sortAt: getSortAt(this),
    };
  }
}
