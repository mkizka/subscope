import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

export interface IRecordQuery {
  exists: (ctx: TransactionContext, uri: AtUri) => Promise<boolean>;
}
