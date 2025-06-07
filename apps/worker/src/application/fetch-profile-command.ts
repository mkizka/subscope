import type { Did } from "@atproto/did";
import type { Job } from "bullmq";

import { createJobLogger } from "../shared/job.js";

export const fetchProfileCommandFactory = (job: Job<Did>) => {
  return {
    did: job.data,
    jobLogger: createJobLogger(job),
  };
};

export type FetchProfileCommand = ReturnType<typeof fetchProfileCommandFactory>;
