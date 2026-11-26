import type { TransactionContext } from "@repo/common/interface";

import type { Follow } from "../../../domain/follow.js";

export interface IFollowRepository {
  save: (params: { ctx: TransactionContext; follow: Follow }) => Promise<void>;
}
