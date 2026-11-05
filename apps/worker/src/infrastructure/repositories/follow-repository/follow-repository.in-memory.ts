import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";

import type { Follow } from "../../../application/dto/follow.js";
import type { IFollowRepository } from "../../../application/interfaces/repositories/follow-repository.js";

export class InMemoryFollowRepository implements IFollowRepository {
  private follows: Map<string, Follow> = new Map();

  add(follow: Follow): void {
    this.follows.set(follow.uri, follow);
  }

  clear(): void {
    this.follows.clear();
  }

  findAll(): Follow[] {
    return Array.from(this.follows.values());
  }

  async find({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<Follow | null> {
    return this.follows.get(uri.toString()) ?? null;
  }

  deleteByUri(uri: AtUri): void {
    this.follows.delete(uri.toString());
  }

  async save(params: {
    ctx: TransactionContext;
    follow: Follow;
  }): Promise<void> {
    this.follows.set(params.follow.uri, params.follow);
  }
}
