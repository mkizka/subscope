import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { ILikeRepository } from "../../../application/interfaces/repositories/like-repository.js";
import type { LikeRow } from "../../../application/record-parsers.js";

export class InMemoryLikeRepository implements ILikeRepository {
  private likes: Map<string, LikeRow> = new Map();

  add(like: LikeRow): void {
    this.likes.set(like.uri, like);
  }

  clear(): void {
    this.likes.clear();
  }

  findAll(): LikeRow[] {
    return Array.from(this.likes.values());
  }

  async find({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<LikeRow | null> {
    return this.likes.get(uri.toString()) ?? null;
  }

  async save(params: {
    ctx: TransactionContext;
    like: LikeRow;
  }): Promise<void> {
    this.likes.set(params.like.uri, params.like);
  }
}
