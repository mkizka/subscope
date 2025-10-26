import type { JobData } from "@repo/common/domain";

import type { JobLogger } from "../../../shared/job.js";

export const aggregatePostStatsCommandFactory = ({
  data,
  jobLogger,
}: {
  data: JobData["aggregatePostStats"];
  jobLogger: JobLogger;
}) => {
  return {
    uri: data.uri,
    type: data.type,
    jobLogger,
  };
};

export type AggregatePostStatsCommand = ReturnType<
  typeof aggregatePostStatsCommandFactory
>;
