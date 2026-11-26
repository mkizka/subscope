import type { BackfillStatus } from "@/app/lib/backfill-status";

export type FollowedAccountsDto = {
  accounts: {
    did: string;
    handle: string;
    displayName?: string;
    avatarUrl?: string;
    memberFollowersCount: number;
    backfillStatus?: BackfillStatus;
  }[];
};
