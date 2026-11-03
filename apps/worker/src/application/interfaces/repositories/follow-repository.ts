import type { TransactionContext } from "@repo/common/domain";

import type { FollowRow } from "../../record-parsers.js";

export interface IFollowRepository {
  save: (params: {
    ctx: TransactionContext;
    follow: FollowRow;
  }) => Promise<void>;
}
