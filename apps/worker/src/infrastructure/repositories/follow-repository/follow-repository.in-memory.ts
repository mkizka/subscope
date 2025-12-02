import type { Follow, TransactionContext } from "@repo/common/domain";

import type { IFollowRepository } from "../../../application/interfaces/repositories/follow-repository.js";

export class InMemoryFollowRepository implements IFollowRepository {
  private follows: Map<string, Follow> = new Map();

  add(follow: Follow): void {
    this.follows.set(follow.uri.toString(), follow);
  }

  clear(): void {
    this.follows.clear();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async upsert(params: {
    ctx: TransactionContext;
    follow: Follow;
  }): Promise<void> {
    this.follows.set(params.follow.uri.toString(), params.follow);
  }
}
