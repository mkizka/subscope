import type { DatabaseClient } from "@repo/common/domain";

import type { IActorQuery } from "../../interfaces/queries/actor-query.js";
import type { IActorStatsRepository } from "../../interfaces/repositories/actor-stats-repository.js";
import type { AggregateActorStatsCommand } from "./aggregate-actor-stats-command.js";

export class AggregateActorStatsUseCase {
  constructor(
    private readonly actorStatsRepository: IActorStatsRepository,
    private readonly actorQuery: IActorQuery,
    private readonly db: DatabaseClient,
  ) {}

  async execute(command: AggregateActorStatsCommand) {
    const ctx = { db: this.db };

    const actorExists = await this.actorQuery.exists({
      ctx,
      did: command.did,
    });
    if (!actorExists) {
      await command.jobLogger.log(
        `Skipping aggregation for ${command.did} - actor not found`,
      );
      return;
    }

    if (command.type === "follows") {
      await this.actorStatsRepository.upsertFollowsCount({
        ctx,
        actorDid: command.did,
      });
    } else if (command.type === "followers") {
      await this.actorStatsRepository.upsertFollowersCount({
        ctx,
        actorDid: command.did,
      });
    } else {
      await this.actorStatsRepository.upsertPostsCount({
        ctx,
        actorDid: command.did,
      });
    }
  }
}
