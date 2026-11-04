import { asDid } from "@atproto/did";
import { getBlobCidString } from "@atproto/lex";
import { validateRecord } from "@repo/common/utils";

import type { Record } from "./record.js";

export type Profile = {
  uri: string;
  cid: string;
  accountDid: string;
  avatarCid: string | null;
  bannerCid: string | null;
  description?: string | null;
  displayName?: string | null;
  createdAt: Date | null;
  indexedAt: Date;
};

export function parseProfile(record: Record): Profile {
  const parsed = validateRecord("app.bsky.actor.profile", record);
  return {
    uri: record.uri.toString(),
    cid: record.cid,
    accountDid: asDid(record.uri.host),
    indexedAt: record.indexedAt,
    avatarCid: getBlobCidString(parsed.avatar) ?? null,
    bannerCid: getBlobCidString(parsed.banner) ?? null,
    description: parsed.description,
    displayName: parsed.displayName,
    createdAt: parsed.createdAt ? new Date(parsed.createdAt) : null,
  };
}
