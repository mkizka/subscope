import type { Record, TransactionContext } from "@dawn/common/domain";
import { Profile } from "@dawn/common/domain";

import type { IIndexCollectionService } from "../interfaces/index-collection-service.js";
import type { IProfileRepository } from "../interfaces/profile-repository.js";
import type { ISubscriptionRepository } from "../interfaces/subscription-repository.js";

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
