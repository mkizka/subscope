import type { Queue } from "bullmq";

import type {
  IJobQueue,
  JobData,
  JobOptions,
  QueueName,
} from "../../domain/interfaces/job-queue.js";

interface AddedJob<T extends QueueName = QueueName> {
  queueName: T;
  jobName: string;
  data: JobData[T];
  options?: JobOptions;
}

export class InMemoryJobQueue implements IJobQueue {
  private jobs: AddedJob[] = [];
  private batchItems = new Map<QueueName, Set<string>>();

  getQueues(): Queue[] {
    return [];
  }

  async add<T extends QueueName>(params: {
    queueName: T;
    jobName: string;
    data: AddedJob<T>["data"];
    options?: JobOptions;
  }): Promise<void> {
    this.jobs.push(params);
  }

  async addBatchItems({
    queueName,
    items,
    options,
  }: {
    queueName: QueueName;
    items: string[];
    options?: JobOptions;
  }): Promise<void> {
    const batch = this.batchItems.get(queueName) ?? new Set();
    items.forEach((item) => batch.add(item));
    this.batchItems.set(queueName, batch);
    this.jobs.push({ queueName, jobName: queueName, data: null, options });
  }

  async popBatchItems(queueName: QueueName, count: number): Promise<string[]> {
    const batch = this.batchItems.get(queueName) ?? new Set();
    const items = [...batch].slice(0, count);
    items.forEach((item) => batch.delete(item));
    return items;
  }

  async countPending(queueName: QueueName): Promise<number> {
    return this.jobs.filter((job) => job.queueName === queueName).length;
  }

  getBatchItems(queueName: QueueName): readonly string[] {
    return [...(this.batchItems.get(queueName) ?? [])];
  }

  clear(): void {
    this.jobs = [];
    this.batchItems.clear();
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
