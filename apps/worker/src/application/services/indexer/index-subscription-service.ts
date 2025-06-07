import { asDid } from "@atproto/did";
import type { Record, TransactionContext } from "@dawn/common/domain";
import { Subscription } from "@dawn/common/domain";

import { env } from "../../../shared/env.js";
import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";
import type { IIndexCollectionService } from "../../interfaces/services/index-collection-service.js";
import type { BackfillService } from "../scheduler/backfill-service.js";

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

    // バックフィル条件：actorのステータスがdirtyかつappviewDidがこのサービスのDIDと一致
    if (
      actor?.backfillStatus === "dirty" &&
      subscription.appviewDid === env.APPVIEW_DID
    ) {
      await this.backfillService.schedule(actor.did);
    }
  }

  shouldSave(_: { ctx: TransactionContext; record: Record }): Promise<boolean> {
    // subscriptionレコードは常に保存する
    return Promise.resolve(true);
  }
}
