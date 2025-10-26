import type { DatabaseClient } from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";
import type { IActorStatsRepository } from "../../interfaces/repositories/actor-stats-repository.js";
import type { AggregateActorStatsCommand } from "./aggregate-actor-stats-command.js";

export class AggregateActorStatsUseCase {
  constructor(
    private readonly actorStatsRepository: IActorStatsRepository,
    private readonly actorRepository: IActorRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["actorStatsRepository", "actorRepository", "db"] as const;

  async execute(command: AggregateActorStatsCommand) {
    const ctx = { db: this.db };

    const actorExists = await this.actorRepository.exists({
      ctx,
      did: command.actorDid,
    });
    if (!actorExists) {
      await command.jobLogger.log(
        `Skipping aggregation for ${command.actorDid} - actor not found`,
      );
      return;
    }

    if (command.type === "follows") {
      await this.actorStatsRepository.upsertFollowsCount({
        ctx,
        actorDid: command.actorDid,
      });
    } else if (command.type === "followers") {
      await this.actorStatsRepository.upsertFollowersCount({
        ctx,
        actorDid: command.actorDid,
      });
    } else {
      await this.actorStatsRepository.upsertPostsCount({
        ctx,
        actorDid: command.actorDid,
      });
    }
  }
}
