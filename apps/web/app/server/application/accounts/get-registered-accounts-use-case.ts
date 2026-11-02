import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";
import type {
  ISubscopeQuery,
  MembersDto,
} from "@/app/server/infrastructure/subscope/subscope-query";

export interface IGetRegisteredAccountsUseCase {
  execute: () => Promise<MembersDto>;
}

export const getRegisteredAccountsUseCaseFactory = ({
  subscopeQuery,
  backfillQuery,
}: {
  subscopeQuery: ISubscopeQuery;
  backfillQuery: IBackfillQuery;
}): IGetRegisteredAccountsUseCase => ({
  async execute() {
    const result = await subscopeQuery.findMembers();
    const statuses = await backfillQuery.findTrackedStatuses(
      result.registeredAccounts.map(
        (registeredAccount) => registeredAccount.did,
      ),
    );
    return {
      ...result,
      registeredAccounts: result.registeredAccounts.map(
        (registeredAccount) => ({
          ...registeredAccount,
          backfillStatus: statuses[registeredAccount.did],
        }),
      ),
    };
  },
});
