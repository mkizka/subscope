import type { Record, TransactionContext } from "@dawn/common/domain";
import { Profile } from "@dawn/common/domain";

import type { IIndexColectionService } from "../interfaces/index-collection-service.js";
import type { IProfileRepository } from "../interfaces/profile-repository.js";
import type { ISubscriptionRepository } from "../interfaces/subscription-repository.js";

export class IndexProfileService implements IIndexColectionService {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["profileRepository", "subscriptionRepository"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const profile = Profile.from(record);

    const shouldSave = await this.shouldSaveProfile(ctx, profile);
    if (!shouldSave) {
      return;
    }

    await this.profileRepository.upsert({ ctx, profile });
  }

  private async shouldSaveProfile(
    ctx: TransactionContext,
    profile: Profile,
  ): Promise<boolean> {
    // subscribers本人なら保存
    return this.subscriptionRepository.isSubscriber(ctx, profile.actorDid);
  }
}
