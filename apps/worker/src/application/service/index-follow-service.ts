import type { Record, TransactionContext } from "@dawn/common/domain";
import { Follow } from "@dawn/common/domain";

import type { IFollowRepository } from "../interfaces/follow-repository.js";
import type { IIndexColectionService } from "../interfaces/index-collection-service.js";
import type { ISubscriptionRepository } from "../interfaces/subscription-repository.js";

export class IndexFollowService implements IIndexColectionService {
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
