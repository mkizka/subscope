import type { ITransactionManager } from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";
import type { IActorStatsRepository } from "../../interfaces/repositories/actor-stats-repository.js";
import type { AggregateActorStatsCommand } from "./aggregate-actor-stats-command.js";

export class AggregateActorStatsUseCase {
  constructor(
    private readonly actorStatsRepository: IActorStatsRepository,
    private readonly actorRepository: IActorRepository,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(command: AggregateActorStatsCommand) {
    const actorExists = await this.transactionManager.transaction(
      async (ctx) => {
        const exists = await this.actorRepository.exists({
          ctx,
          did: command.did,
        });
        if (!exists) return false;
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
