import type { BackfillStatus } from "@/app/lib/backfill-status";

export type TrackedAccountsDto = {
  total: number;
  accounts: {
    did: string;
    handle: string;
    displayName?: string;
    avatarUrl?: string;
    registeredFollowersCount: number;
    backfillStatus?: BackfillStatus;
  }[];
};
