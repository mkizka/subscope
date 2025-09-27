import { asDid } from "@atproto/did";
import type { Like, TransactionContext } from "@repo/common/domain";

import type { IActorRepository } from "../application/interfaces/repositories/actor-repository.js";
import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class LikeIndexingPolicy {
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

  async shouldIndex(ctx: TransactionContext, like: Like): Promise<boolean> {
    const targetActorDid = asDid(like.subjectUri.hostname);

    // いいねしたactorまたはいいねされたactorがsubscriberなら保存
    const hasAnySubscriber = await this.subscriptionRepository.hasSubscriber(
      ctx,
      [like.actorDid, targetActorDid],
    );
    if (hasAnySubscriber) {
      return true;
    }

    // Level2: いいねされたactorがsubscribersのフォロイーなら保存
    if (this.indexLevel === 2) {
      const actor = await this.actorRepository.findByDid({
        ctx,
        did: targetActorDid,
      });
      return actor?.isFollowedBySubscriber ?? false;
    }

    return false;
  }
}
