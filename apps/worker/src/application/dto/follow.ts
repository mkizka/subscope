import { asDid, type Did } from "@atproto/did";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export type Follow = {
  uri: string;
  cid: string;
  accountDid: Did;
  subjectDid: Did;
  createdAt: Date;
  indexedAt: Date;
};

export function parseFollow(record: Record): Follow {
  const parsed = validateRecord("app.bsky.graph.follow", record);
  return {
    uri: record.uri.toString(),
    cid: record.cid,
    accountDid: asDid(record.uri.host),
    indexedAt: record.indexedAt,
    subjectDid: parsed.subject,
    createdAt: new Date(parsed.createdAt),
  };
}
