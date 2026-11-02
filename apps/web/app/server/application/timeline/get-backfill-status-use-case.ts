import type { BackfillStatus } from "@repo/common/domain";

import type { IBackfillQuery } from "@/app/server/infrastructure/backfill/backfill-query";

export type BackfillStatusDto = {
  status: BackfillStatus;
};

export interface IGetBackfillStatusUseCase {
  execute: (did: string) => Promise<BackfillStatusDto>;
}

export const getBackfillStatusUseCaseFactory = ({
  backfillQuery,
}: {
  backfillQuery: IBackfillQuery;
}): IGetBackfillStatusUseCase => ({
  async execute(did) {
    const statuses = await backfillQuery.findTrackedStatuses([did]);
    return { status: statuses[did] ?? "inProgress" };
  },
});
