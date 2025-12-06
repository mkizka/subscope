import type { IJobLogger } from "@repo/common/domain";
import type { Job } from "bullmq";

export const createJobLogger = (job: Job): IJobLogger => {
  return {
    log: (message: string) => job.log(message),
  };
};

export type { IJobLogger as JobLogger } from "@repo/common/domain";
