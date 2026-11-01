import type {
  DatabaseClient,
  IJobScheduler,
  ITapClient,
  JobData,
} from "@repo/common/domain";

import type {
  BackfillStatus,
  IActorRepository,
} from "../../interfaces/repositories/actor-repository.js";
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
    private readonly db: DatabaseClient,
  ) {}

  async execute({ did, attempt }: JobData["checkBackfill"]) {
    const ctx = { db: this.db };
    const isTrackedActor =
      (await this.subscriptionRepository.isSubscriber(ctx, did)) ||
      (await this.followRepository.isFollowedByAnySubscriber({
        ctx,
        subjectDid: did,
      }));
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
