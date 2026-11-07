import type { BackfillStatus } from "@/app/lib/backfill-status";

export type MembersDto = {
  serverMembers: {
    did: string;
    handle: string;
    displayName?: string;
    avatarUrl?: string;
    description?: string;
    isAdmin: boolean;
    backfillStatus?: BackfillStatus;
  }[];
  hasMore: boolean;
};
