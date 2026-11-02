import type { JobData } from "@repo/common/domain";

import type { JobLogger } from "../../../shared/job.js";

export const aggregateActorStatsCommandFactory = ({
  data,
  jobLogger,
}: {
  data: JobData["aggregateActorStats"];
  jobLogger: JobLogger;
}) => {
  return {
    did: data.did,
    jobLogger,
  };
};

export type AggregateActorStatsCommand = ReturnType<
  typeof aggregateActorStatsCommandFactory
>;
