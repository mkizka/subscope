import type { BackfillStatus } from "@/app/lib/backfill-status";

export interface IBackfillQuery {
  findTrackedStatuses: (
    dids: string[],
  ) => Promise<Record<string, { status: BackfillStatus; isMember: boolean }>>;
}
