import { asDid } from "@atproto/did";
import type { Record, TransactionContext } from "@repo/common/domain";
import { Subscription } from "@repo/common/domain";

import type { SubscriptionIndexingPolicy } from "../../../domain/subscription-indexing-policy.js";
import { env } from "../../../shared/env.js";
import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { IIndexCollectionService } from "../../interfaces/services/index-collection-service.js";
import type { BackfillService } from "../scheduler/backfill-service.js";

export class SubscriptionIndexer implements IIndexCollectionService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly actorRepository: IActorRepository,
    private readonly backfillService: BackfillService,
    private readonly subscriptionIndexingPolicy: SubscriptionIndexingPolicy,
  ) {}
  static inject = [
    "subscriptionRepository",
    "actorRepository",
    "backfillService",
    "subscriptionIndexingPolicy",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const subscription = Subscription.from(record);
    await this.subscriptionRepository.upsert({ ctx, subscription });

    const actor = await this.actorRepository.findByDid({
      ctx,
      did: asDid(record.actorDid),
    });

    // TODO: アプリケーションサービスに移動
    // バックフィル条件：actorのステータスがdirtyかつappviewDidがこのサービスのDIDと一致
    if (
      actor?.backfillStatus === "dirty" &&
      subscription.appviewDid === env.APPVIEW_DID
    ) {
      await this.backfillService.schedule(actor.did);
    }
  }

  async shouldSave({
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
