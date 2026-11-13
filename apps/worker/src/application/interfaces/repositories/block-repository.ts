import type { TransactionContext } from "@repo/common/interface";

import type { Block } from "../../dto/block.js";

export interface IBlockRepository {
  save: (params: { ctx: TransactionContext; block: Block }) => Promise<void>;
}
