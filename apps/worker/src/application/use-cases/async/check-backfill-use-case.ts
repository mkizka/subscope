import type {
  BackfillStatus,
  IJobScheduler,
  ITapClient,
  ITransactionManager,
  JobData,
} from "@repo/common/domain";

import type { ISubscriptionQuery } from "../../interfaces/queries/subscription-query.js";
import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";

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
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute({ did, attempt }: JobData["checkBackfill"]) {
    const actor = await this.transactionManager.transaction(async (ctx) => {
      const isTrackedActor =
        (await this.subscriptionQuery.isSubscriber(ctx, did)) ||
        (await this.subscriptionQuery.isFollowedByAnySubscriber(ctx, did));
      return isTrackedActor ? this.actorRepository.find({ ctx, did }) : null;
    });
    if (!actor) {
      return;
    }
    const status = toBackfillStatus(await this.tapClient.getRepoState(did));
    actor.updateBackfillStatus(status);
    await this.transactionManager.transaction((ctx) =>
      this.actorRepository.save({ ctx, actor }),
    );
    if (status !== "completed") {
      await this.jobScheduler.scheduleCheckBackfill(did, attempt + 1);
    }
  }
}
