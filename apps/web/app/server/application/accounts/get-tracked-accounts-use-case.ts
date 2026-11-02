import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";
import type {
  ISubscopeQuery,
  TrackedAccountsDto,
} from "@/app/server/infrastructure/subscope/subscope-query";

export interface IGetTrackedAccountsUseCase {
  execute: (did: string) => Promise<TrackedAccountsDto>;
}

export const getTrackedAccountsUseCaseFactory = ({
  subscopeQuery,
  backfillQuery,
}: {
  subscopeQuery: ISubscopeQuery;
  backfillQuery: IBackfillQuery;
}): IGetTrackedAccountsUseCase => ({
  async execute(did) {
    const result = await subscopeQuery.findTrackedAccounts(did);
    const statuses = await backfillQuery.findTrackedStatuses(
      result.actors.map((actor) => actor.did),
    );
    return {
      ...result,
      actors: result.actors.map((actor) => ({
        ...actor,
        backfillStatus: statuses[actor.did],
      })),
    };
  },
});
