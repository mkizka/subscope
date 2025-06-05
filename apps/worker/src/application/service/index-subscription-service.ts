import type { Record, TransactionContext } from "@dawn/common/domain";
import type { IJobQueue } from "@dawn/common/domain";
import { Subscription } from "@dawn/common/domain";

import type { IIndexCollectionService } from "../interfaces/index-collection-service.js";
import type { ISubscriptionRepository } from "../interfaces/subscription-repository.js";

export class IndexSubscriptionService implements IIndexCollectionService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly jobQueue: IJobQueue,
  ) {}
  static inject = ["subscriptionRepository", "jobQueue"] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const subscription = Subscription.from(record);
    await this.subscriptionRepository.upsert({ ctx, subscription });
    await this.jobQueue.add({
      queueName: "backfill",
      jobName: `backfill-${record.actorDid}`,
      data: { did: record.actorDid },
    });
  }

  shouldSave(_: { ctx: TransactionContext; record: Record }): Promise<boolean> {
    // subscriptionレコードは常に保存する
    return Promise.resolve(true);
  }
}
