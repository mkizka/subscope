import type { TransactionContext } from "@repo/common/interface";

import type { IGateQuery } from "../interfaces/gate-query.js";
import type { Origin } from "../origin.js";
import type { Post } from "../post.js";

export class GatePolicy {
  constructor(private readonly gateQuery: IGateQuery) {}

  async violatesEmbeddingRules({
    ctx,
    origin,
    post,
  }: {
    ctx: TransactionContext;
    origin: Origin;
    post: Post;
  }) {
    const quotedUri = post.quotedPostUri;
    if (
      !origin.judgesGateViolation ||
      !quotedUri ||
      quotedUri.hostname === post.accountDid
    ) {
      return false;
    }
    const postgate = await this.gateQuery.findPostgate(ctx, quotedUri);
    return !!postgate?.disablesEmbedding;
  }
}
