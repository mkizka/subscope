import type { Record, TransactionContext } from "@repo/common/domain";
import { Repost } from "@repo/common/domain";

import type { IRepostRepository } from "../../interfaces/repositories/repost-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { IIndexCollectionService } from "../../interfaces/services/index-collection-service.js";

export class IndexRepostService implements IIndexCollectionService {
  constructor(
    private readonly repostRepository: IRepostRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["repostRepository", "subscriptionRepository"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const repost = Repost.from(record);
    await this.repostRepository.upsert({ ctx, repost });
  }

  async shouldSave({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const repost = Repost.from(record);
    // subscribers本人のrepostは保存
    if (await this.subscriptionRepository.isSubscriber(ctx, repost.actorDid)) {
      return true;
    }

    // repost者のフォロワーが1人以上subscribersなら保存
    return await this.subscriptionRepository.hasSubscriberFollower(
      ctx,
      repost.actorDid,
    );
  }
}