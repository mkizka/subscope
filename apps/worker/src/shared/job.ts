import type { Job } from "bullmq";

export const createJobLogger = (job: Job) => {
  return {
    log: (message: string) => job.log(message),
  };
};

export type JobLogger = ReturnType<typeof createJobLogger>;
