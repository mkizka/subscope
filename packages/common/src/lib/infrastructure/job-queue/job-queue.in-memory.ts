import type { Queue } from "bullmq";

import type {
  IJobQueue,
  JobData,
  QueueName,
} from "../../domain/interfaces/job-queue.js";

interface AddedJob<T extends QueueName = QueueName> {
  queueName: T;
  jobName: string;
  data: JobData[T];
  options?: {
    jobId?: string;
    delay?: number;
  };
}

export class InMemoryJobQueue implements IJobQueue {
  private jobs: AddedJob[] = [];

  getQueues(): Queue[] {
    return [];
  }

  async add<T extends QueueName>(params: {
    queueName: T;
    jobName: string;
    data: AddedJob<T>["data"];
    options?: { jobId?: string; delay?: number };
  }): Promise<void> {
    this.jobs.push(params);
  }

  clear(): void {
    this.jobs = [];
  }

  findByQueueName<T extends QueueName>(queueName: T): readonly AddedJob<T>[] {
    return this.jobs.filter(
      (job): job is AddedJob<T> => job.queueName === queueName,
    );
  }

  getJobs(): readonly AddedJob[] {
    return this.jobs;
  }
}
