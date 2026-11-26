import type { Did } from "@atproto/did";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export class ListItem {
  private constructor(
    readonly uri: string,
    readonly cid: string,
    readonly accountDid: Did,
    readonly listUri: string,
    readonly subjectDid: Did,
    readonly createdAt: Date,
    readonly indexedAt: Date,
  ) {}

  static fromRecord(record: Record) {
    const parsed = validateRecord("app.bsky.graph.listitem", record);
    return new ListItem(
      record.uri.toString(),
      record.cid,
      record.uri.did,
      parsed.list,
      parsed.subject,
      new Date(parsed.createdAt),
      record.indexedAt,
    );
  }
}
