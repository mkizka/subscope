import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import type { Repost } from "@repo/common/domain";

import type { IActorRepository } from "../application/interfaces/repositories/actor-repository.js";
import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class RepostIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly actorRepository: IActorRepository,
    private readonly indexLevel: number,
  ) {}
  static inject = [
    "subscriptionRepository",
    "actorRepository",
    "indexLevel",
  ] as const;

  async shouldIndex(ctx: TransactionContext, repost: Repost): Promise<boolean> {
    // リポストしたactorまたはリポストされたactorがsubscriberなら保存
    const hasAnySubscriber = await this.subscriptionRepository.hasSubscriber(
      ctx,
      [repost.actorDid, asDid(repost.subjectUri.hostname)],
    );
    if (hasAnySubscriber) {
      return true;
    }

    const followerCheckDids = [repost.actorDid];
    if (this.indexLevel === 2) {
      followerCheckDids.push(asDid(repost.subjectUri.hostname));
    }

    // リポストしたactorまたはリポストされたactorがsubscriberのフォロイーなら保存
    return this.actorRepository.hasFollowedBySubscribers({
      ctx,
      actorDids: followerCheckDids,
    });
  }
}
