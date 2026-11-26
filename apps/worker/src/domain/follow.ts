import type { Did } from "@atproto/did";
import { validateRecord } from "@repo/common/utils";

import type { Notification } from "./notification.js";
import type { Record } from "./record.js";
import { getSortAt } from "./sort-at.js";

export class Follow {
  readonly uri: string;
  readonly cid: string;
  readonly accountDid: Did;
  readonly subjectDid: Did;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  private constructor(params: {
    uri: string;
    cid: string;
    accountDid: Did;
    subjectDid: Did;
    createdAt: Date;
    indexedAt: Date;
  }) {
    this.uri = params.uri;
    this.cid = params.cid;
    this.accountDid = params.accountDid;
    this.subjectDid = params.subjectDid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  static fromRecord(record: Record) {
    const parsed = validateRecord("app.bsky.graph.follow", record);
    return new Follow({
      uri: record.uri.toString(),
      cid: record.cid,
      accountDid: record.uri.did,
      subjectDid: parsed.subject,
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }

  get notification(): Notification {
    return {
      recordUri: this.uri,
      recipientDid: this.subjectDid,
      authorDid: this.accountDid,
      reason: "follow",
      reasonSubject: null,
      sortAt: getSortAt(this),
    };
  }
}
