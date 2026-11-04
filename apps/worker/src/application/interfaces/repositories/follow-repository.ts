import type { TransactionContext } from "@repo/common/domain";

import type { Follow } from "../../models/follow.js";

export interface IFollowRepository {
  save: (params: { ctx: TransactionContext; follow: Follow }) => Promise<void>;
}
