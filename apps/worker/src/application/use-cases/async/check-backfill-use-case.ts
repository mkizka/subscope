import type {
  BackfillStatus,
  IJobScheduler,
  ITapClient,
  ITransactionManager,
  JobData,
} from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";
import type { IFollowRepository } from "../../interfaces/repositories/follow-repository.js";
import type { ISubscriptionRepository } from "../../interfaces/repositories/subscription-repository.js";

const IN_PROGRESS_STATES = ["pending", "desynchronized", "resyncing"];

const toBackfillStatus = (tapState: string): BackfillStatus => {
  if (tapState === "error") return "error";
  if (IN_PROGRESS_STATES.includes(tapState)) return "inProgress";
  return "completed";
};

export class CheckBackfillUseCase {
  constructor(
    private readonly tapClient: ITapClient,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly followRepository: IFollowRepository,
    private readonly actorRepository: IActorRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute({ did, attempt }: JobData["checkBackfill"]) {
    const actor = await this.transactionManager.transaction(async (ctx) => {
      const isTrackedActor =
        (await this.subscriptionRepository.isSubscriber(ctx, did)) ||
        (await this.followRepository.isFollowedByAnySubscriber({
          ctx,
          subjectDid: did,
        }));
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
