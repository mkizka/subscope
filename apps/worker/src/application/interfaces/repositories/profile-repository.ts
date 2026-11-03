import type { TransactionContext } from "@repo/common/domain";

import type { ProfileRow } from "../../record-parsers.js";

export interface IProfileRepository {
  save: (params: {
    ctx: TransactionContext;
    profile: ProfileRow;
  }) => Promise<void>;
}
