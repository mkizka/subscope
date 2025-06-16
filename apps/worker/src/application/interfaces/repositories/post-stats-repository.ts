import type { TransactionContext } from "@repo/common/domain";

export interface IPostStatsRepository {
  upsertLikeCount: (params: {
    ctx: TransactionContext;
    postUri: string;
  }) => Promise<void>;

  upsertRepostCount: (params: {
    ctx: TransactionContext;
    postUri: string;
  }) => Promise<void>;
}
