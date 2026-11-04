import type { MembersDto } from "@/app/server/application/dto/members-dto";
import type { IBackfillQuery } from "@/app/server/application/interfaces/backfill-query";
import type { ISubscopeQuery } from "@/app/server/application/interfaces/subscope-query";

export interface IGetRegisteredAccountsUseCase {
  execute: (q?: string) => Promise<MembersDto>;
}

export const getRegisteredAccountsUseCaseFactory = ({
  subscopeQuery,
  backfillQuery,
}: {
  subscopeQuery: ISubscopeQuery;
  backfillQuery: IBackfillQuery;
}): IGetRegisteredAccountsUseCase => ({
  async execute(q) {
    const result = await subscopeQuery.findMembers(q);
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
