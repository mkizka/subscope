import type { Did } from "@atproto/did";
import {
  Actor,
  type IJobQueue,
  type TransactionContext,
} from "@dawn/common/domain";
import type { Handle, SupportedCollection } from "@dawn/common/utils";

import type { IActorRepository } from "../interfaces/actor-repository.js";
import type { ISubscriptionRepository } from "../interfaces/subscription-repository.js";

const SUBSCRIBER_BACKFILL_COLLECTIONS: SupportedCollection[] = [
  "app.bsky.actor.profile",
  "app.bsky.graph.follow",
  "app.bsky.feed.post",
];

const NON_SUBSCRIBER_BACKFILL_COLLECTIONS: SupportedCollection[] = [
  "app.bsky.actor.profile",
];

export class IndexActorService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly jobQueue: IJobQueue,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = [
    "actorRepository",
    "jobQueue",
    "subscriptionRepository",
  ] as const;

  async upsert({
    ctx,
    did,
    handle,
  }: {
    ctx: TransactionContext;
    did: Did;
    handle?: Handle;
  }) {
    const existingActor = await this.actorRepository.findByDid({ ctx, did });

    if (existingActor) {
      // インデックスされた時点からhandleが変更されていれば更新
      if (handle && existingActor.handle !== handle) {
        const actor = new Actor({
          did: existingActor.did,
          handle,
          backfillStatus: existingActor.backfillStatus,
          backfillVersion: existingActor.backfillVersion,
        });
        await this.actorRepository.upsert({ ctx, actor });
        return;
      }
      // インデックス済みのactorがhandleを持っていなければ解決を予約
      if (!existingActor.handle) {
        await this.scheduleResolveDid(did);
        return;
      }
      // ハンドルを変更も新規解決もする必要がなければ何もしない
      return;
    }

    // インデックスされていない場合は新規登録
    const actor = new Actor({ did, handle });
    await this.actorRepository.upsert({ ctx, actor });

    // ハンドルが分からなければ解決を予約
    if (!handle) {
      await this.scheduleResolveDid(did);
    }

    // actorがdirtyの場合、バックフィルを予約
    if (actor.backfillStatus === "dirty") {
      const targetCollections = await this.getTargetCollections(ctx, did);
      await this.scheduleBackfill(did, targetCollections);
    }
  }

  private async scheduleResolveDid(did: Did) {
    await this.jobQueue.add({
      queueName: "resolveDid",
      jobName: `at://${did}`,
      data: did,
    });
  }

  private async getTargetCollections(
    ctx: TransactionContext,
    did: Did,
  ): Promise<SupportedCollection[]> {
    const isSubscriber = await this.subscriptionRepository.isSubscriber(
      ctx,
      did,
    );
    if (isSubscriber) {
      return SUBSCRIBER_BACKFILL_COLLECTIONS;
    }
    return NON_SUBSCRIBER_BACKFILL_COLLECTIONS;
  }

  private async scheduleBackfill(
    did: Did,
    targetCollections: SupportedCollection[],
  ) {
    await this.jobQueue.add({
      queueName: "backfill",
      jobName: `at://${did}`,
      data: {
        did,
        targetCollections,
      },
    });
  }
}
