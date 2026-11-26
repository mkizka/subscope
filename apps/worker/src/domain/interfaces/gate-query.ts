import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { Gate } from "../gate.js";
import type { Post } from "../post.js";

export interface IGateQuery {
  findPostgate: (
    ctx: TransactionContext,
    postUri: AtUri,
  ) => Promise<Gate | null>;
  findThreadgate: (
    ctx: TransactionContext,
    rootUri: AtUri,
  ) => Promise<Gate | null>;
  findPost: (ctx: TransactionContext, uri: AtUri) => Promise<Post | null>;
  follows: (
    ctx: TransactionContext,
    params: { accountDid: string; subjectDid: string },
  ) => Promise<boolean>;
  isListed: (
    ctx: TransactionContext,
    params: { listUris: string[]; subjectDid: string },
  ) => Promise<boolean>;
}
