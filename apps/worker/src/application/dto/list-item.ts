import { asDid, type Did } from "@atproto/did";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export type ListItem = {
  uri: string;
  cid: string;
  accountDid: Did;
  listUri: string;
  subjectDid: Did;
  createdAt: Date;
  indexedAt: Date;
};

export function parseListItem(record: Record): ListItem {
  const parsed = validateRecord("app.bsky.graph.listitem", record);
  return {
    uri: record.uri.toString(),
    cid: record.cid,
    accountDid: asDid(record.uri.host),
    indexedAt: record.indexedAt,
    listUri: parsed.list,
    subjectDid: parsed.subject,
    createdAt: new Date(parsed.createdAt),
  };
}
