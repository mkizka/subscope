import type { DatabaseClient, IJobScheduler } from "@repo/common/domain";

import type { IBackfillStatusRepository } from "../../interfaces/repositories/backfill-status-repository.js";

export class ScheduleBackfillChecksUseCase {
  constructor(
    private readonly backfillStatusRepository: IBackfillStatusRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly db: DatabaseClient,
  ) {}

  async execute() {
    const dids = await this.backfillStatusRepository.findUncheckedTrackedDids({
      db: this.db,
    });
    for (const did of dids) {
      await this.jobScheduler.scheduleCheckBackfill(did, 0);
    }
  }
}
