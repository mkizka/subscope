import type {
  BackfillStatus,
  IJobScheduler,
  ITapClient,
  ITransactionManager,
  JobData,
} from "@repo/common/domain";

import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
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
    private readonly registrationQuery: IRegistrationQuery,
    private readonly actorRepository: IActorRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute({ did, attempt }: JobData["checkBackfill"]) {
    const actor = await this.transactionManager.transaction(async (ctx) => {
      const isTrackedAccount =
        (await this.registrationQuery.isRegistered(ctx, did)) ||
        (await this.registrationQuery.isFollowedByAnyRegisteredAccount(
          ctx,
          did,
        ));
      return isTrackedAccount ? this.actorRepository.find({ ctx, did }) : null;
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
