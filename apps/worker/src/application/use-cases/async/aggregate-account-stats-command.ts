import type { JobData } from "@repo/common/interface";

import type { JobLogger } from "../../../shared/job.js";

export const aggregateAccountStatsCommandFactory = ({
  data,
  jobLogger,
}: {
  data: JobData["aggregateAccountStats"];
  jobLogger: JobLogger;
}) => {
  return {
    did: data.did,
    jobLogger,
  };
};

export type AggregateAccountStatsCommand = ReturnType<
  typeof aggregateAccountStatsCommandFactory
>;
