import type { DatabaseClient, IJobScheduler } from "@repo/common/domain";

import type { IActorQuery } from "../../interfaces/queries/actor-query.js";

export class ScheduleBackfillChecksUseCase {
  constructor(
    private readonly actorQuery: IActorQuery,
    private readonly jobScheduler: IJobScheduler,
    private readonly db: DatabaseClient,
  ) {}

  async execute() {
    const dids = await this.actorQuery.findTrackedDidsWithoutBackfillStatus({
      db: this.db,
    });
    for (const did of dids) {
      await this.jobScheduler.scheduleCheckBackfill(did, 0);
    }
  }
}
