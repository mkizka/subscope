import type {
  DatabaseClient,
  IJobScheduler,
  ITapClient,
  JobData,
} from "@repo/common/domain";

import type { ISubscriptionQuery } from "../../interfaces/queries/subscription-query.js";
import type {
  BackfillStatus,
  IActorRepository,
} from "../../interfaces/repositories/actor-repository.js";

const IN_PROGRESS_STATES = ["pending", "desynchronized", "resyncing"];

const toBackfillStatus = (tapState: string): BackfillStatus => {
  if (tapState === "error") return "error";
  if (IN_PROGRESS_STATES.includes(tapState)) return "inProgress";
  return "completed";
};

export class CheckBackfillUseCase {
  constructor(
    private readonly tapClient: ITapClient,
    private readonly subscriptionQuery: ISubscriptionQuery,
    private readonly actorRepository: IActorRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly db: DatabaseClient,
  ) {}

  async execute({ did, attempt }: JobData["checkBackfill"]) {
    const ctx = { db: this.db };
    const isTrackedActor =
      (await this.subscriptionQuery.isSubscriber(ctx, did)) ||
      (await this.subscriptionQuery.isFollowedByAnySubscriber(ctx, did));
    if (!isTrackedActor) {
      return;
    }
    const status = toBackfillStatus(await this.tapClient.getRepoState(did));
    await this.actorRepository.updateBackfillStatus({ ctx, did, status });
    if (status !== "completed") {
      await this.jobScheduler.scheduleCheckBackfill(did, attempt + 1);
    }
  }
}
