import type { TrackedAccountsDto } from "@/app/server/application/dto/tracked-accounts-dto";
import type { ISubscopeQuery } from "@/app/server/application/interfaces/subscope-query";
import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";

export interface IGetTrackedAccountsUseCase {
  execute: (did: string, q?: string) => Promise<TrackedAccountsDto>;
}

export const getTrackedAccountsUseCaseFactory = ({
  subscopeQuery,
  backfillQuery,
}: {
  subscopeQuery: ISubscopeQuery;
  backfillQuery: IBackfillQuery;
}): IGetTrackedAccountsUseCase => ({
  async execute(did, q) {
    const result = await subscopeQuery.findTrackedAccounts(did, q);
    const statuses = await backfillQuery.findTrackedStatuses(
      result.accounts.map((account) => account.did),
    );
    return {
      ...result,
      accounts: result.accounts.map((account) => ({
        ...account,
        backfillStatus: statuses[account.did],
      })),
    };
  },
});
