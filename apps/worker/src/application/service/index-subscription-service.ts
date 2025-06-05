import type { Record, TransactionContext } from "@dawn/common/domain";
import { Subscription } from "@dawn/common/domain";

import type { IIndexCollectionService } from "../interfaces/index-collection-service.js";
import type { ISubscriptionRepository } from "../interfaces/subscription-repository.js";

export class IndexSubscriptionService implements IIndexCollectionService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["subscriptionRepository"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const subscription = Subscription.from(record);
    await this.subscriptionRepository.upsert({ ctx, subscription });
  }

  shouldSave(_: { ctx: TransactionContext; record: Record }): Promise<boolean> {
    // subscriptionレコードは常に保存する
    return Promise.resolve(true);
  }
}
