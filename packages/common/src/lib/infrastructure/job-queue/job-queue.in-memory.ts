import type { Queue } from "bullmq";

import type {
  AddedJob,
  IJobQueue,
  QueueName,
} from "../../domain/interfaces/job-queue.js";

export class InMemoryJobQueue implements IJobQueue {
  private jobs: AddedJob[] = [];

  getQueues(): Queue[] {
    return [];
  }

  add<T extends QueueName>(params: {
    queueName: T;
    jobName: string;
    data: AddedJob<T>["data"];
    options?: { jobId?: string; delay?: number };
  }): Promise<void> {
    this.jobs.push(params);
    return Promise.resolve();
  }

  clear(): void {
    this.jobs = [];
  }

  getAddedJobs(): readonly AddedJob[] {
    return this.jobs;
  }
}
