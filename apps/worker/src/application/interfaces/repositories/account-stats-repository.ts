import type { TransactionContext } from "@repo/common/interface";

export interface AccountStats {
  accountDid: string;
  followsCount: number;
  followersCount: number;
  postsCount: number;
}

export interface IAccountStatsRepository {
  save: (params: {
    ctx: TransactionContext;
    stats: AccountStats;
  }) => Promise<void>;
}
