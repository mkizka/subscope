import type { AtUri } from "@atproto/syntax";
import type { Post, TransactionContext } from "@repo/common/domain";

export interface IPostRepository {
  save: (params: { ctx: TransactionContext; post: Post }) => Promise<void>;
  exists: (ctx: TransactionContext, uri: AtUri) => Promise<boolean>;
  findReplyParentUri: (
    ctx: TransactionContext,
    uri: AtUri,
  ) => Promise<AtUri | null>;
}
