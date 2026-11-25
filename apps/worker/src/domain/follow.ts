import type { Did } from "@atproto/did";
import { validateRecord } from "@repo/common/utils";

import type { Notification } from "./notification.js";
import type { Record } from "./record.js";
import { getSortAt } from "./sort-at.js";

export class Follow {
  private constructor(
    readonly uri: string,
    readonly cid: string,
    readonly accountDid: Did,
    readonly subjectDid: Did,
    readonly createdAt: Date,
    readonly indexedAt: Date,
  ) {}

  static fromRecord(record: Record) {
    const parsed = validateRecord("app.bsky.graph.follow", record);
    return new Follow(
      record.uri.toString(),
      record.cid,
      record.uri.did,
      parsed.subject,
      new Date(parsed.createdAt),
      record.indexedAt,
    );
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

  changesTrackedAccounts({ followerIsMember }: { followerIsMember: boolean }) {
    return followerIsMember;
  }
}
