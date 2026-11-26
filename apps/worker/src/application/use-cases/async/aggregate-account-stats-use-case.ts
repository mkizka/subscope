import type { ITransactionManager } from "@repo/common/interface";

import type { IAccountQuery } from "../../interfaces/queries/account-query.js";
import type { IAccountStatsQuery } from "../../interfaces/queries/account-stats-query.js";
import type { IAccountStatsRepository } from "../../interfaces/repositories/account-stats-repository.js";
import type { AggregateAccountStatsCommand } from "./aggregate-account-stats-command.js";

export class AggregateAccountStatsUseCase {
  constructor(
    private readonly deps: {
      accountStatsQuery: IAccountStatsQuery;
      accountStatsRepository: IAccountStatsRepository;
      accountQuery: IAccountQuery;
      transactionManager: ITransactionManager;
    },
  ) {}

  async execute(command: AggregateAccountStatsCommand) {
    const accountExists = await this.deps.transactionManager.transaction(
      async (ctx) => {
        const exists = await this.deps.accountQuery.exists({
          ctx,
          did: command.did,
        });
        if (!exists) return false;
        const stats = await this.deps.accountStatsQuery.countStats({
          ctx,
          accountDid: command.did,
        });
        await this.deps.accountStatsRepository.save({ ctx, stats });
        return true;
      },
    );
    if (!accountExists) {
      await command.jobLogger.log(
        `Skipping aggregation for ${command.did} - account not found`,
      );
    }
  }
}
