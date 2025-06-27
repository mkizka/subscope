import { asDid } from "@atproto/did";
import type { Record, TransactionContext } from "@repo/common/domain";
import { Subscription } from "@repo/common/domain";

import type { SubscriptionIndexingPolicy } from "../../../domain/subscription-indexing-policy.js";
import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { ICollectionIndexer } from "../../interfaces/services/index-collection-service.js";
import type { BackfillScheduler } from "../scheduler/backfill-scheduler.js";

export class SubscriptionIndexer implements ICollectionIndexer {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly actorRepository: IActorRepository,
    private readonly backfillScheduler: BackfillScheduler,
    private readonly subscriptionIndexingPolicy: SubscriptionIndexingPolicy,
  ) {}
  static inject = [
    "subscriptionRepository",
    "actorRepository",
    "backfillScheduler",
    "subscriptionIndexingPolicy",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const subscription = Subscription.from(record);
    await this.subscriptionRepository.upsert({ ctx, subscription });

    const actor = await this.actorRepository.findByDid({
      ctx,
      did: asDid(record.actorDid),
    });

    if (actor?.backfillStatus === "dirty") {
      await this.backfillScheduler.schedule(actor.did);
    }
  }

  async shouldIndex({
    ctx,
    record,
  }: {
    ctx: TransactionContext;
    record: Record;
  }): Promise<boolean> {
    const subscription = Subscription.from(record);
    return await this.subscriptionIndexingPolicy.shouldIndex(ctx, subscription);
  }
}
