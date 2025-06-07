import type { Job } from "bullmq";

export const createJobLogger = (job: Job) => {
  return {
    log: (message: string) => job.log(message),
    info: (data: Record<string, unknown>, message: string) => {
      const logMessage = `${message} - ${JSON.stringify(data)}`;
      return job.log(logMessage);
    },
  };
};

export type JobLogger = ReturnType<typeof createJobLogger>;
