import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

import type { IFollowRepository } from "../../../application/interfaces/repositories/follow-repository.js";
import type { FollowRow } from "../../../application/record-parsers.js";

export class InMemoryFollowRepository implements IFollowRepository {
  private follows: Map<string, FollowRow> = new Map();

  add(follow: FollowRow): void {
    this.follows.set(follow.uri, follow);
  }

  clear(): void {
    this.follows.clear();
  }

  findAll(): FollowRow[] {
    return Array.from(this.follows.values());
  }

  async find({
    uri,
  }: {
    ctx: TransactionContext;
    uri: AtUri;
  }): Promise<FollowRow | null> {
    return this.follows.get(uri.toString()) ?? null;
  }

  deleteByUri(uri: AtUri): void {
    this.follows.delete(uri.toString());
  }

  async save(params: {
    ctx: TransactionContext;
    follow: FollowRow;
  }): Promise<void> {
    this.follows.set(params.follow.uri, params.follow);
  }
}
