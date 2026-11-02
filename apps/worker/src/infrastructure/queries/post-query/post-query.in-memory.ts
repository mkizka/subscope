import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { IPostQuery } from "../../../application/interfaces/queries/post-query.js";
import type { InMemoryPostRepository } from "../../repositories/post-repository/post-repository.in-memory.js";

export class InMemoryPostQuery implements IPostQuery {
  constructor(private readonly postRepository: InMemoryPostRepository) {}

  async exists(ctx: TransactionContext, uri: AtUri): Promise<boolean> {
    return (await this.postRepository.find({ ctx, uri })) !== null;
  }

  async findReplyParentUri(
    ctx: TransactionContext,
    uri: AtUri,
  ): Promise<AtUri | null> {
    return (
      (await this.postRepository.find({ ctx, uri }))?.replyParent?.uri ?? null
    );
  }
}
