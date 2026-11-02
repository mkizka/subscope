import type { ITransactionManager } from "@repo/common/domain";

import type { IActorQuery } from "../../interfaces/queries/actor-query.js";
import type { IActorStatsQuery } from "../../interfaces/queries/actor-stats-query.js";
import type { IActorStatsRepository } from "../../interfaces/repositories/actor-stats-repository.js";
import type { AggregateActorStatsCommand } from "./aggregate-actor-stats-command.js";

export class AggregateActorStatsUseCase {
  constructor(
    private readonly actorStatsQuery: IActorStatsQuery,
    private readonly actorStatsRepository: IActorStatsRepository,
    private readonly actorQuery: IActorQuery,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(command: AggregateActorStatsCommand) {
    const actorExists = await this.transactionManager.transaction(
      async (ctx) => {
        const exists = await this.actorQuery.exists({
          ctx,
          did: command.did,
        });
        if (!exists) return false;
        const stats = await this.actorStatsQuery.countStats({
          ctx,
          actorDid: command.did,
        });
        await this.actorStatsRepository.save({ ctx, stats });
        return true;
      },
    );
    if (!actorExists) {
      await command.jobLogger.log(
        `Skipping aggregation for ${command.did} - actor not found`,
      );
    }
  }
}
