import type {
  IJobScheduler,
  ITransactionManager,
  JobData,
} from "@repo/common/domain";
import type { BackfillStatus } from "@repo/db";

import type { ITapClient } from "../../interfaces/external/tap-client.js";
import type { IRegistrationQuery } from "../../interfaces/queries/registration-query.js";
import type { IAccountRepository } from "../../interfaces/repositories/account-repository.js";

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
    private readonly accountRepository: IAccountRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute({ did, attempt }: JobData["checkBackfill"]) {
    const account = await this.transactionManager.transaction(async (ctx) => {
      const isTrackedAccount =
        (await this.registrationQuery.isRegistered(ctx, did)) ||
        (await this.registrationQuery.isFollowedByAnyRegisteredAccount(
          ctx,
          did,
        ));
      return isTrackedAccount
        ? this.accountRepository.find({ ctx, did })
        : null;
    });
    if (!account) {
      return;
    }
    const status = toBackfillStatus(await this.tapClient.getRepoState(did));
    account.updateBackfillStatus(status);
    await this.transactionManager.transaction((ctx) =>
      this.accountRepository.save({ ctx, account }),
    );
    if (status !== "completed") {
      await this.jobScheduler.scheduleCheckBackfill(did, attempt + 1);
    }
  }
}
