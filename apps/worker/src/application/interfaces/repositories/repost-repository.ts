import type { TransactionContext } from "@repo/common/domain";

import type { Repost } from "../../models/repost.js";

export interface IRepostRepository {
  save: (params: { ctx: TransactionContext; repost: Repost }) => Promise<void>;
}
