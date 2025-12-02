import type { Queue } from "bullmq";

import type {
  IJobQueue,
  JobData,
  QueueName,
} from "../domain/interfaces/job-queue.js";

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

  add<T extends QueueName>(params: {
    queueName: T;
    jobName: string;
    data: JobData[T];
    options?: { jobId?: string; delay?: number };
  }): Promise<void> {
    this.jobs.push(params);
    return Promise.resolve();
  }

  clear(): void {
    this.jobs = [];
  }

  getJobs(): AddedJob[] {
    return [...this.jobs];
  }

  getJobsByQueue<T extends QueueName>(queueName: T): AddedJob<T>[] {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return this.jobs.filter(
      (job) => job.queueName === queueName,
    ) as AddedJob<T>[];
  }

  hasJob<T extends QueueName>(
    queueName: T,
    predicate: (job: AddedJob<T>) => boolean,
  ): boolean {
    const jobs = this.getJobsByQueue(queueName);
    return jobs.some(predicate);
  }
}
