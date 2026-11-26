import type { Did } from "@atproto/did";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export class ListItem {
  readonly uri: string;
  readonly cid: string;
  readonly accountDid: Did;
  readonly listUri: string;
  readonly subjectDid: Did;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  private constructor(params: {
    uri: string;
    cid: string;
    accountDid: Did;
    listUri: string;
    subjectDid: Did;
    createdAt: Date;
    indexedAt: Date;
  }) {
    this.uri = params.uri;
    this.cid = params.cid;
    this.accountDid = params.accountDid;
    this.listUri = params.listUri;
    this.subjectDid = params.subjectDid;
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  static fromRecord(record: Record) {
    const parsed = validateRecord("app.bsky.graph.listitem", record);
    return new ListItem({
      uri: record.uri.toString(),
      cid: record.cid,
      accountDid: record.uri.did,
      listUri: parsed.list,
      subjectDid: parsed.subject,
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}
