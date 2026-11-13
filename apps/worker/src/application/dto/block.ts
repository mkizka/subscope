import { asDid, type Did } from "@atproto/did";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export type Block = {
  uri: string;
  cid: string;
  accountDid: Did;
  subjectDid: Did;
  createdAt: Date;
  indexedAt: Date;
};

export function parseBlock(record: Record): Block {
  const parsed = validateRecord("app.bsky.graph.block", record);
  return {
    uri: record.uri.toString(),
    cid: record.cid,
    accountDid: asDid(record.uri.host),
    indexedAt: record.indexedAt,
    subjectDid: parsed.subject,
    createdAt: new Date(parsed.createdAt),
  };
}
