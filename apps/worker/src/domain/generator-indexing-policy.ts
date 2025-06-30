import type { TransactionContext } from "@repo/common/domain";
import type { Generator } from "@repo/common/domain";

import type { ISubscriptionRepository } from "../application/interfaces/repositories/subscription-repository.js";

export class GeneratorIndexingPolicy {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async shouldIndex(
    ctx: TransactionContext,
    generator: Generator,
  ): Promise<boolean> {
    // subscribers本人の場合のみ保存
    return await this.subscriptionRepository.isSubscriber(
      ctx,
      generator.actorDid,
    );
  }
}
