import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";
import type {
  ISubscopeQuery,
  TrackedActorsDto,
} from "@/app/server/infrastructure/subscope/subscope-query";

export interface IGetTrackedActorsUseCase {
  execute: (did: string) => Promise<TrackedActorsDto>;
}

export const getTrackedActorsUseCaseFactory = ({
  subscopeQuery,
  backfillQuery,
}: {
  subscopeQuery: ISubscopeQuery;
  backfillQuery: IBackfillQuery;
}): IGetTrackedActorsUseCase => ({
  async execute(did) {
    const result = await subscopeQuery.findTrackedActors(did);
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
