import type { JobData } from "@repo/common/domain";

import type { JobLogger } from "../../../shared/job.js";

export const aggregateStatsCommandFactory = ({
  data,
  jobLogger,
}: {
  data: JobData["aggregateStats"];
  jobLogger: JobLogger;
}) => {
  return {
    postUri: data.postUri,
    type: data.type,
    jobLogger,
  };
};

export type AggregateStatsCommand = ReturnType<
  typeof aggregateStatsCommandFactory
>;
