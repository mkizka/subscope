import type { Did } from "@atproto/did";
import type { IJobQueue, TransactionContext } from "@dawn/common/domain";
import type { SupportedCollection } from "@dawn/common/utils";

import type { ISubscriptionRepository } from "../interfaces/subscription-repository.js";

const SUBSCRIBER_BACKFILL_COLLECTIONS: SupportedCollection[] = [
  "app.bsky.actor.profile",
  "app.bsky.graph.follow",
  "app.bsky.feed.post",
];

const NON_SUBSCRIBER_BACKFILL_COLLECTIONS: SupportedCollection[] = [
  "app.bsky.actor.profile",
];

export class BackfillService {
  constructor(
    private readonly jobQueue: IJobQueue,
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}
  static inject = ["jobQueue", "subscriptionRepository"] as const;

  async schedule({
    ctx,
    did,
  }: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<void> {
    const targetCollections = await this.getTargetCollections(ctx, did);
    await this.scheduleBackfill(did, targetCollections);
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
  ): Promise<void> {
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
