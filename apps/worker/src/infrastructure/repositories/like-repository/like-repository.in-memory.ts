import type { AtUri } from "@atproto/syntax";
import type { Like, TransactionContext } from "@repo/common/domain";

import type { ILikeRepository } from "../../../application/interfaces/repositories/like-repository.js";

export class InMemoryLikeRepository implements ILikeRepository {
  private likes: Map<string, Like> = new Map();

  add(like: Like): void {
    this.likes.set(like.uri.toString(), like);
  }

  clear(): void {
    this.likes.clear();
  }

  findByUri(uri: AtUri): Like | null {
    return this.likes.get(uri.toString()) ?? null;
  }

  async upsert(params: { ctx: TransactionContext; like: Like }): Promise<void> {
    this.likes.set(params.like.uri.toString(), params.like);
  }
}
