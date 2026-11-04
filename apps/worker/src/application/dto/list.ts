import { asDid } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export type List = {
  uri: string;
  cid: string;
  accountDid: string;
  purpose: string;
  name: string;
  description?: string | null;
  avatarCid?: string | null;
  createdAt: Date;
  indexedAt: Date;
};

export function parseList(record: Record): List {
  const parsed = validateRecord("app.bsky.graph.list", record);
  return {
    uri: record.uri.toString(),
    cid: record.cid,
    accountDid: asDid(record.uri.host),
    indexedAt: record.indexedAt,
    purpose: parsed.purpose,
    name: parsed.name,
    description: parsed.description,
    avatarCid: getBlobCidString(parsed.avatar),
    createdAt: new Date(parsed.createdAt),
  };
}
