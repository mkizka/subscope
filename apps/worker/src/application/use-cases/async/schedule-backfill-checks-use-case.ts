import type {
  IJobScheduler,
  ITransactionManager,
} from "@repo/common/interface";

import type { IAccountQuery } from "../../interfaces/queries/account-query.js";

export class ScheduleBackfillChecksUseCase {
  constructor(
    private readonly deps: {
      accountQuery: IAccountQuery;
      jobScheduler: IJobScheduler;
      transactionManager: ITransactionManager;
    },
  ) {}

  async execute() {
    const dids = await this.deps.transactionManager.transaction((ctx) =>
      this.deps.accountQuery.findMemberDidsWithoutBackfillStatus(ctx),
    );
    for (const did of dids) {
      await this.deps.jobScheduler.scheduleCheckBackfill(did, 0);
    }
  }
}
