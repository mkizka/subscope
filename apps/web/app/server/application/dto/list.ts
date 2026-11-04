import type { ListView } from "@repo/client/lex/app/bsky/graph/defs";

import type { BackfillStatus } from "@/app/lib/backfill-status";

export type ListDto = {
  uri: ListView["uri"];
  rkey: string;
  creatorDid: string;
  name: string;
  description?: string;
  avatarUrl?: string;
};

export type ListMemberDto = {
  listItemUri: string;
  did: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  description?: string;
  backfillStatus?: BackfillStatus;
};
