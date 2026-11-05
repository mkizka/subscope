import type { TransactionContext } from "@repo/common/interface";

import type { Follow } from "../../dto/follow.js";

export interface IFollowRepository {
  save: (params: { ctx: TransactionContext; follow: Follow }) => Promise<void>;
}
