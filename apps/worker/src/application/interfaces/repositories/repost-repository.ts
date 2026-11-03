import type { TransactionContext } from "@repo/common/domain";

import type { RepostRow } from "../../record-parsers.js";

export interface IRepostRepository {
  save: (params: {
    ctx: TransactionContext;
    repost: RepostRow;
  }) => Promise<void>;
}
