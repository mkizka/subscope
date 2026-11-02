import type { IJobScheduler, ITransactionManager } from "@repo/common/domain";

import type { IActorQuery } from "../../interfaces/queries/actor-query.js";

export class ScheduleBackfillChecksUseCase {
  constructor(
    private readonly actorQuery: IActorQuery,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute() {
    const dids = await this.transactionManager.transaction((ctx) =>
      this.actorQuery.findTrackedDidsWithoutBackfillStatus(ctx),
    );
    for (const did of dids) {
      await this.jobScheduler.scheduleCheckBackfill(did, 0);
    }
  }
}
