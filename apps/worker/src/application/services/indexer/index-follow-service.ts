import type { Record, TransactionContext } from "@repo/common/domain";
import { Follow } from "@repo/common/domain";

import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { IIndexCollectionService } from "../../interfaces/services/index-collection-service.js";

export class IndexFollowService implements IIndexCollectionService {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["followRepository", "subscriptionRepository"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const follow = Follow.from(record);
    await this.followRepository.upsert({ ctx, follow });
  }

  async shouldSave({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const follow = Follow.from(record);
    // フォローまたはフォロイーがsubscribersなら保存
    return this.subscriptionRepository.hasAnySubscriber(ctx, [
      follow.actorDid,
      follow.subjectDid,
    ]);
  }
}
