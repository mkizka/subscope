import { asDid } from "@atproto/did";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export type Like = {
  uri: string;
  cid: string;
  accountDid: string;
  subjectUri: string;
  subjectCid: string;
  createdAt: Date;
  indexedAt: Date;
};

export function parseLike(record: Record): Like {
  const parsed = validateRecord("app.bsky.feed.like", record);
  return {
    uri: record.uri.toString(),
    cid: record.cid,
    accountDid: asDid(record.uri.host),
    indexedAt: record.indexedAt,
    subjectUri: parsed.subject.uri,
    subjectCid: parsed.subject.cid,
    createdAt: new Date(parsed.createdAt),
  };
}
