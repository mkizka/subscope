import type { Record, TransactionContext } from "@repo/common/domain";
import { Profile } from "@repo/common/domain";

import type { IProfileRepository } from "../../interfaces/repositories/profile-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { IIndexCollectionService } from "../../interfaces/services/index-collection-service.js";

export class IndexProfileService implements IIndexCollectionService {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["profileRepository", "subscriptionRepository"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const profile = Profile.from(record);
    await this.profileRepository.upsert({ ctx, profile });
  }

  async shouldSave({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const profile = Profile.from(record);
    // subscribers本人なら保存
    return this.subscriptionRepository.isSubscriber(ctx, profile.actorDid);
  }
}
