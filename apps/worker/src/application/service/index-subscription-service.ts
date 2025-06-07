import { asDid } from "@atproto/did";
import type { Record, TransactionContext } from "@dawn/common/domain";
import { Subscription } from "@dawn/common/domain";

import type { IActorRepository } from "../interfaces/actor-repository.js";
import type { IIndexCollectionService } from "../interfaces/index-collection-service.js";
import type { ISubscriptionRepository } from "../interfaces/subscription-repository.js";
import type { BackfillService } from "./backfill-service.js";

export class IndexSubscriptionService implements IIndexCollectionService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly actorRepository: IActorRepository,
    private readonly backfillService: BackfillService,
  ) {}
  static inject = [
    "subscriptionRepository",
    "actorRepository",
    "backfillService",
  ] as const;

  async upsert({ ctx, record }: { ctx: TransactionContext; record: Record }) {
    const subscription = Subscription.from(record);
    await this.subscriptionRepository.upsert({ ctx, subscription });

    const actor = await this.actorRepository.findByDid({
      ctx,
      did: asDid(record.actorDid),
    });
    if (actor?.backfillStatus === "dirty") {
      await this.backfillService.schedule(actor.did);
    }
  }

  shouldSave(_: { ctx: TransactionContext; record: Record }): Promise<boolean> {
    // subscriptionレコードは常に保存する
    return Promise.resolve(true);
  }
}
