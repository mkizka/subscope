import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { IPostQuery } from "../../../application/interfaces/queries/post-query.js";
import type { InMemoryPostRepository } from "../../repositories/post-repository/post-repository.in-memory.js";

export class InMemoryPostQuery implements IPostQuery {
  constructor(private readonly postRepository: InMemoryPostRepository) {}

  async findReplyAncestorUris(
    ctx: TransactionContext,
    parentUri: AtUri,
    limit: number,
  ): Promise<AtUri[]> {
    const uris = [];
    for (
      let uri: AtUri | null = parentUri;
      uri && uris.length < limit;
      uri =
        (await this.postRepository.find({ ctx, uri }))?.replyParent?.uri ?? null
    ) {
      uris.push(uri);
    }
    return uris;
  }
}
