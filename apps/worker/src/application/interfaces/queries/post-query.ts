import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

export interface IPostQuery {
  findReplyAncestorUris: (
    ctx: TransactionContext,
    parentUri: AtUri,
    limit: number,
  ) => Promise<AtUri[]>;
}
