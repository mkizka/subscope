import type { TransactionContext } from "@repo/common/interface";

import type { Repost } from "../../../domain/repost.js";

export interface IRepostRepository {
  save: (params: { ctx: TransactionContext; repost: Repost }) => Promise<void>;
}
