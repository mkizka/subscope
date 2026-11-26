import { listRule } from "@repo/client/app/bsky/feed/threadgate";
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

  async violatesThreadgate({
    ctx,
    origin,
    post,
  }: {
    ctx: TransactionContext;
    origin: Origin;
    post: Post;
  }) {
    const rootUri = post.replyRoot?.uri;
    if (
      !origin.judgesGateViolation ||
      !rootUri ||
      rootUri.collection !== "app.bsky.feed.post" ||
      rootUri.hostname === post.accountDid
    ) {
      return false;
    }
    const rules = (await this.gateQuery.findThreadgate(ctx, rootUri))
      ?.replyRules;
    if (!rules) {
      return false;
    }
    const ownerDid = rootUri.hostname;
    const replierDid = post.accountDid;
    const has = (type: string) =>
      rules.some((rule) => rule.$type === `app.bsky.feed.threadgate#${type}`);
    const listUris = rules
      .filter((rule) => listRule.isTypeOf(rule))
      .map((rule) => rule.list);
    const allowed =
      (has("mentionRule") &&
        !!(await this.gateQuery.findPost(ctx, rootUri))?.mentionDids.includes(
          replierDid,
        )) ||
      (has("followingRule") &&
        (await this.gateQuery.follows(ctx, {
          accountDid: ownerDid,
          subjectDid: replierDid,
        }))) ||
      (has("followerRule") &&
        (await this.gateQuery.follows(ctx, {
          accountDid: replierDid,
          subjectDid: ownerDid,
        }))) ||
      (listUris.length > 0 &&
        (await this.gateQuery.isListed(ctx, {
          listUris,
          subjectDid: replierDid,
        })));
    return !allowed;
  }
}
