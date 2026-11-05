import type { TransactionContext } from "@repo/common/interface";

import type { AccountStats } from "../repositories/account-stats-repository.js";

export interface IAccountStatsQuery {
  countStats: (params: {
    ctx: TransactionContext;
    accountDid: string;
  }) => Promise<AccountStats>;
}
