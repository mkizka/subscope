import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import type { Repost } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class RepostIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly indexLevel: number,
  ) {}
  static inject = ["subscriptionRepository", "indexLevel"] as const;

  async shouldIndex(ctx: TransactionContext, repost: Repost): Promise<boolean> {
    // リポストしたactorまたはリポストされたactorがsubscriberなら保存
    const hasAnySubscriber = await this.subscriptionRepository.hasAnySubscriber(
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
    return this.subscriptionRepository.hasAnySubscriberFollower(
      ctx,
      followerCheckDids,
    );
  }
}
