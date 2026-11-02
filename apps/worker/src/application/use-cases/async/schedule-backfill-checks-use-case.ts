import type { IJobScheduler, ITransactionManager } from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";

export class ScheduleBackfillChecksUseCase {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly jobScheduler: IJobScheduler,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute() {
    const dids = await this.transactionManager.transaction((ctx) =>
      this.actorRepository.findTrackedDidsWithoutBackfillStatus(ctx),
    );
    for (const did of dids) {
      await this.jobScheduler.scheduleCheckBackfill(did, 0);
    }
  }
}
