import { asDid } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";
import type { Repost } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class RepostIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async shouldIndex(ctx: TransactionContext, repost: Repost): Promise<boolean> {
    // リポストしたactorまたはリポストされたactorがsubscriberなら保存
    const hasAnySubscriber = await this.subscriptionRepository.hasSubscriber(
      ctx,
      [repost.actorDid, asDid(repost.subjectUri.hostname)],
    );
    if (hasAnySubscriber) {
      return true;
    }

    // リポストしたactorまたはリポストされたactorがsubscriberのフォロイーなら保存
    return this.subscriptionRepository.hasFolloweeOfSubscribers(ctx, [
      repost.actorDid,
      asDid(repost.subjectUri.hostname),
    ]);
  }
}
