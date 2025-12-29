import type { AtUri } from "@atproto/syntax";
import type { Follow, TransactionContext } from "@repo/common/domain";

import type { IFollowRepository } from "../../../application/interfaces/repositories/follow-repository.js";
import type { InMemorySubscriptionRepository } from "../subscription-repository/subscription-repository.in-memory.js";

export class InMemoryFollowRepository implements IFollowRepository {
  private follows: Map<string, Follow> = new Map();
  private subscriptionRepository: InMemorySubscriptionRepository | null = null;

  constructor(subscriptionRepository: InMemorySubscriptionRepository) {
    this.subscriptionRepository = subscriptionRepository;
  }
  static inject = ["subscriptionRepository"] as const;

  add(follow: Follow): void {
    this.follows.set(follow.uri.toString(), follow);
  }

  clear(): void {
    this.follows.clear();
  }

  findAll(): Follow[] {
    return Array.from(this.follows.values());
  }

  findByUri(uri: AtUri): Follow | null {
    return this.follows.get(uri.toString()) ?? null;
  }

  deleteByUri(uri: AtUri): void {
    this.follows.delete(uri.toString());
  }

  async upsert(params: {
    ctx: TransactionContext;
    follow: Follow;
  }): Promise<void> {
    this.follows.set(params.follow.uri.toString(), params.follow);
  }

  async isFollowedByAnySubscriber({
    ctx,
    subjectDid,
  }: {
    ctx: TransactionContext;
    subjectDid: string;
  }): Promise<boolean> {
    if (!this.subscriptionRepository) {
      return false;
    }

    for (const follow of this.follows.values()) {
      if (follow.subjectDid === subjectDid) {
        const isSubscriber = await this.subscriptionRepository.isSubscriber(
          ctx,
          follow.actorDid,
        );
        if (isSubscriber) {
          return true;
        }
      }
    }
    return false;
  }
}
