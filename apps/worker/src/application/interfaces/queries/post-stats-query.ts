import type { TransactionContext } from "@repo/common/interface";

import type { PostStats } from "../repositories/post-stats-repository.js";

export interface IPostStatsQuery {
  countStats: (params: {
    ctx: TransactionContext;
    uris: string[];
  }) => Promise<PostStats[]>;
}
