import type { DatabaseClient, IJobScheduler } from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";

export class ScheduleBackfillChecksUseCase {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly db: DatabaseClient,
  ) {}

  async execute() {
    const dids =
      await this.actorRepository.findTrackedDidsWithoutBackfillStatus({
        db: this.db,
      });
    for (const did of dids) {
      await this.jobScheduler.scheduleCheckBackfill(did, 0);
    }
  }
}
