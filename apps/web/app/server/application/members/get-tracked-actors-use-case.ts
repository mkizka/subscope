import type {
  ISubscopeQuery,
  TrackedActorsDto,
} from "@/app/server/infrastructure/subscope/subscope-query";

export interface IGetTrackedActorsUseCase {
  execute: (did: string) => Promise<TrackedActorsDto>;
}

export const getTrackedActorsUseCaseFactory = ({
  subscopeQuery,
}: {
  subscopeQuery: ISubscopeQuery;
}): IGetTrackedActorsUseCase => ({
  execute: (did) => subscopeQuery.findTrackedActors(did),
});
