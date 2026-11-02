import type { Did } from "@atproto/did";
import { type ITransactionManager, Subscription } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../../../application/interfaces/subscription-repository.js";

export class UpdateSeenUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async execute(params: { actorDid: Did; seenAt: Date }): Promise<void> {
    const subscription = await this.subscriptionRepository.find(
      params.actorDid,
    );
    if (!subscription) {
      return;
    }
    await this.transactionManager.transaction(async (ctx) => {
      await this.subscriptionRepository.save({
        ctx,
        subscription: new Subscription({
          actorDid: subscription.actorDid,
          inviteCode: subscription.inviteCode,
          seenAt: params.seenAt,
          createdAt: subscription.createdAt,
        }),
      });
    });
  }
}
