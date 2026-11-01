import type { QueueOptions } from "bullmq";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

import type {
  IJobQueue,
  JobData,
  JobOptions,
  QueueName,
} from "../../domain/interfaces/job-queue.js";

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
  attempts: 4,
  backoff: {
    type: "custom",
  },
} satisfies QueueOptions["defaultJobOptions"];

export class JobQueue implements IJobQueue {
  private readonly queues: {
    [key in QueueName]: Queue;
  };
  private readonly redis: Redis;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, { lazyConnect: true });
    const queueOptions = createQueueOptionsBuilder(redisUrl);
    this.queues = {
      resolveDid: new Queue("resolveDid", queueOptions(withRetry)),
      fetchRecord: new Queue("fetchRecord", queueOptions(withRetry)),
      aggregatePostStats: new Queue(
        "aggregatePostStats",
        queueOptions(withRetry),
      ),
      aggregateActorStats: new Queue(
        "aggregateActorStats",
        queueOptions(withRetry),
      ),
      syncTapRepo: new Queue("syncTapRepo", queueOptions(withRetry)),
      label: new Queue("label", queueOptions(withRetry)),
    };
  }

  async add<T extends QueueName>({
    queueName,
    jobName,
    data,
    options,
  }: {
    queueName: T;
    jobName: string;
    data: JobData[T];
    options?: JobOptions;
  }) {
    await this.queues[queueName].add(jobName, data, {
      ...options,
      // https://docs.bullmq.io/guide/jobs/job-ids
      jobId: options?.jobId?.replaceAll(":", "_"),
    });
  }

  async addBatchItems({
    queueName,
    items,
    options,
  }: {
    queueName: QueueName;
    items: string[];
    options?: JobOptions;
  }) {
    await this.redis.sadd(`${queueName}:batch`, items);
    await this.queues[queueName].add(queueName, null, {
      ...options,
      deduplication: { id: queueName, keepLastIfActive: true },
    });
  }

  async popBatchItems(queueName: QueueName, count: number) {
    return await this.redis.spop(`${queueName}:batch`, count);
  }

  async close() {
    this.redis.disconnect();
    await Promise.all(Object.values(this.queues).map((queue) => queue.close()));
  }

  getQueues() {
    return Object.values(this.queues);
  }
}
