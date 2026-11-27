import type { BackfillStatus } from "@/app/lib/backfill-status";

export interface IBackfillQuery {
  findMemberStatuses: (
    dids: string[],
  ) => Promise<Record<string, BackfillStatus>>;
}
