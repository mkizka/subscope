import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { Like } from "../../../application/dto/like.js";
import type { ILikeRepository } from "../../../application/interfaces/repositories/like-repository.js";

export class InMemoryLikeRepository implements ILikeRepository {
  private likes: Map<string, Like> = new Map();

  add(like: Like): void {
    this.likes.set(like.uri, like);
  }

  clear(): void {
    this.likes.clear();
  }

  findAll(): Like[] {
    return Array.from(this.likes.values());
  }

  async find({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<Like | null> {
    return this.likes.get(uri.toString()) ?? null;
  }

  async save(params: { ctx: TransactionContext; like: Like }): Promise<void> {
    this.likes.set(params.like.uri, params.like);
  }
}
