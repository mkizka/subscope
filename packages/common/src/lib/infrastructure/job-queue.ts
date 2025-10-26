import type { QueueOptions } from "bullmq";
import { Queue } from "bullmq";

import type {
  IJobQueue,
  JobData,
  QueueName,
} from "../domain/interfaces/job-queue.js";

const createQueueOptionsBuilder =
  (redisUrl: string) =>
  (jobOptions?: QueueOptions["defaultJobOptions"]): QueueOptions => ({
    defaultJobOptions: {
      removeOnComplete: {
        age: 10, // 完了速度を測定するために短時間(Prometheusのスクレイピング時間5秒と少し)で削除
      },
      removeOnFail: {
        age: 24 * 60 * 60,
      },
      ...jobOptions,
    },
    connection: {
      url: redisUrl,
    },
  });

const withRetry = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 10000, // 10,20,40秒後にリトライ
  },
} satisfies QueueOptions["defaultJobOptions"];

export class JobQueue implements IJobQueue {
  private readonly queues: {
    [key in QueueName]: Queue;
  };

  constructor(redisUrl: string) {
    const queueOptions = createQueueOptionsBuilder(redisUrl);
    this.queues = {
      resolveDid: new Queue("resolveDid", queueOptions(withRetry)),
      fetchRecord: new Queue("fetchRecord", queueOptions(withRetry)),
      account: new Queue("account", queueOptions(withRetry)),
      identity: new Queue("identity", queueOptions(withRetry)),
      commit: new Queue("commit", queueOptions(withRetry)),
      backfill: new Queue("backfill", queueOptions()),
      aggregateStats: new Queue("aggregateStats", queueOptions(withRetry)),
      aggregateActorStats: new Queue(
        "aggregateActorStats",
        queueOptions(withRetry),
      ),
    };
  }
  static inject = ["redisUrl"] as const;

  async add<T extends QueueName>({
    queueName,
    jobName,
    data,
    options,
  }: {
    queueName: T;
    jobName: string;
    data: JobData[T];
    options?: {
      jobId?: string;
      delay?: number;
    };
  }) {
    await this.queues[queueName].add(jobName, data, {
      ...options,
      // https://docs.bullmq.io/guide/jobs/job-ids
      jobId: options?.jobId?.replaceAll(":", "_"),
    });
  }

  getQueues() {
    return Object.values(this.queues);
  }
}
