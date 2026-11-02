import type { DatabaseClient } from "@repo/common/domain";

import type { IActorStatsQuery } from "../../interfaces/queries/actor-stats-query.js";
import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";
import type { IActorStatsRepository } from "../../interfaces/repositories/actor-stats-repository.js";
import type { AggregateActorStatsCommand } from "./aggregate-actor-stats-command.js";

export class AggregateActorStatsUseCase {
  constructor(
    private readonly actorStatsQuery: IActorStatsQuery,
    private readonly actorStatsRepository: IActorStatsRepository,
    private readonly actorRepository: IActorRepository,
    private readonly db: DatabaseClient,
  ) {}

  async execute(command: AggregateActorStatsCommand) {
    const ctx = { db: this.db };

    const actorExists = await this.actorRepository.exists({
      ctx,
      did: command.did,
    });
    if (!actorExists) {
      await command.jobLogger.log(
        `Skipping aggregation for ${command.did} - actor not found`,
      );
      return;
    }

    const stats = await this.actorStatsQuery.countStats({
      ctx,
      actorDid: command.did,
    });
    await this.actorStatsRepository.save({ ctx, stats });
  }
}
