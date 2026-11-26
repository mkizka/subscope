import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import { validateRecord } from "@repo/common/utils";

import type { Notification } from "./notification.js";
import type { Record } from "./record.js";
import { getSortAt } from "./sort-at.js";

export class Like {
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
    const parsed = validateRecord("app.bsky.feed.like", record);
    return new Like(
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
