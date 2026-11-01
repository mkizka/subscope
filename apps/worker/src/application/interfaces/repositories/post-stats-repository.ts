import type { TransactionContext } from "@repo/common/domain";

export interface IPostStatsRepository {
  upsertMany: (params: {
    ctx: TransactionContext;
    uris: string[];
  }) => Promise<void>;
}
