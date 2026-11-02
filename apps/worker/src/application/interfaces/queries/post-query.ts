import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

export interface IPostQuery {
  exists: (ctx: TransactionContext, uri: AtUri) => Promise<boolean>;
  findReplyParentUri: (
    ctx: TransactionContext,
    uri: AtUri,
  ) => Promise<AtUri | null>;
}
