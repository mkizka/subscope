import { asDid } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export type Generator = {
  uri: string;
  cid: string;
  accountDid: string;
  did: string;
  displayName: string;
  description?: string | null;
  avatarCid?: string | null;
  createdAt: Date;
  indexedAt: Date;
};

export function parseGenerator(record: Record): Generator {
  const parsed = validateRecord("app.bsky.feed.generator", record);
  return {
    uri: record.uri.toString(),
    cid: record.cid,
    accountDid: asDid(record.uri.host),
    indexedAt: record.indexedAt,
    did: parsed.did,
    displayName: parsed.displayName,
    description: parsed.description,
    avatarCid: getBlobCidString(parsed.avatar),
    createdAt: new Date(parsed.createdAt),
  };
}
