import type { IJobScheduler, ITransactionManager } from "@repo/common/domain";

import type { IAccountQuery } from "../../interfaces/queries/account-query.js";

export class ScheduleBackfillChecksUseCase {
  constructor(
    private readonly accountQuery: IAccountQuery,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute() {
    const dids = await this.transactionManager.transaction((ctx) =>
      this.accountQuery.findTrackedDidsWithoutBackfillStatus(ctx),
    );
    for (const did of dids) {
      await this.jobScheduler.scheduleCheckBackfill(did, 0);
    }
  }
}
