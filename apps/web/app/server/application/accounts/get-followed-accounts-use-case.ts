import type { FollowedAccountsDto } from "@/app/server/application/dto/followed-accounts-dto";
import type { IBackfillQuery } from "@/app/server/application/interfaces/backfill-query";
import type { ISubscopeQuery } from "@/app/server/application/interfaces/subscope-query";

export interface IGetFollowedAccountsUseCase {
  execute: (did: string, q?: string) => Promise<FollowedAccountsDto>;
}

export const getFollowedAccountsUseCaseFactory = ({
  subscopeQuery,
  backfillQuery,
}: {
  subscopeQuery: ISubscopeQuery;
  backfillQuery: IBackfillQuery;
}): IGetFollowedAccountsUseCase => ({
  async execute(did, q) {
    const result = await subscopeQuery.findFollowedAccounts(did, q);
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
