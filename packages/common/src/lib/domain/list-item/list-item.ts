import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";

import { validateRecord } from "../../utils/record.js";
import type { Record } from "../record/record.js";

export type ListItemParams = {
  uri: AtUri | string;
  cid: string;
  accountDid: string;
  listUri: AtUri | string;
  subjectDid: string;
  createdAt: Date;
  indexedAt: Date;
};

export class ListItem {
  readonly uri: AtUri;
  readonly cid: string;
  readonly accountDid: Did;
  readonly listUri: AtUri;
  readonly subjectDid: Did;
  readonly createdAt: Date;
  readonly indexedAt: Date;

  constructor(params: ListItemParams) {
    this.uri = new AtUri(params.uri.toString());
    this.cid = params.cid;
    this.accountDid = asDid(params.accountDid);
    this.listUri = new AtUri(params.listUri.toString());
    this.subjectDid = asDid(params.subjectDid);
    this.createdAt = params.createdAt;
    this.indexedAt = params.indexedAt;
  }

  static from(record: Record) {
    const parsed = validateRecord("app.bsky.graph.listitem", record);
    return new ListItem({
      uri: record.uri,
      cid: record.cid,
      accountDid: record.uri.host,
      listUri: parsed.list,
      subjectDid: parsed.subject,
      createdAt: new Date(parsed.createdAt),
      indexedAt: record.indexedAt,
    });
  }
}
