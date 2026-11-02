import type { TransactionContext } from "@repo/common/domain";

import type { AccountStats } from "../repositories/account-stats-repository.js";

export interface IAccountStatsQuery {
  countStats: (params: {
    ctx: TransactionContext;
    accountDid: string;
  }) => Promise<AccountStats>;
}
