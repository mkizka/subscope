import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { Gate } from "../gate.js";

export interface IGateQuery {
  findPostgate: (
    ctx: TransactionContext,
    postUri: AtUri,
  ) => Promise<Gate | null>;
}
