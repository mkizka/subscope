import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { validateRecord } from "@repo/common/utils";

import type { FeedItem } from "./feed-item.js";
import type { Notification } from "./notification.js";
import type { Record } from "./record.js";
import { getSortAt } from "./sort-at.js";

export class Repost {
  private constructor(
    readonly uri: string,
    readonly cid: string,
    readonly accountDid: Did,
    readonly subjectUri: string,
    readonly subjectCid: string,
    readonly createdAt: Date,
    readonly indexedAt: Date,
  ) {}

  static fromRecord(record: Record) {
    const parsed = validateRecord("app.bsky.feed.repost", record);
    return new Repost(
      record.uri.toString(),
      record.cid,
      record.uri.did,
      parsed.subject.uri,
      parsed.subject.cid,
      new Date(parsed.createdAt),
      record.indexedAt,
    );
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
