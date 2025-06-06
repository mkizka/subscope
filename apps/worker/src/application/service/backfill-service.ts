import type { Did } from "@atproto/did";
import type { IJobQueue, TransactionContext } from "@dawn/common/domain";
import type { SupportedCollection } from "@dawn/common/utils";

const BACKFILL_COLLECTIONS: SupportedCollection[] = [
  "app.bsky.actor.profile",
  "app.bsky.graph.follow",
  "app.bsky.feed.post",
];

export class BackfillService {
  constructor(private readonly jobQueue: IJobQueue) {}
  static inject = ["jobQueue"] as const;

  async schedule({
    ctx: _ctx,
    did,
  }: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<void> {
    await this.jobQueue.add({
      queueName: "backfill",
      jobName: `at://${did}`,
      data: {
        did,
        targetCollections: BACKFILL_COLLECTIONS,
      },
    });
  }
}
