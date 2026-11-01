import type {
  BackfillStatusDto,
  IBackfillQuery,
} from "@/app/server/infrastructure/backfill/backfill-query";

export interface IGetBackfillStatusUseCase {
  execute: (did: string) => Promise<BackfillStatusDto>;
}

export const getBackfillStatusUseCaseFactory = ({
  backfillQuery,
}: {
  backfillQuery: IBackfillQuery;
}): IGetBackfillStatusUseCase => ({
  execute: (did) => backfillQuery.countUnfinished(did),
});
