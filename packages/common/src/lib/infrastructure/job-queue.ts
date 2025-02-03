import type { QueueOptions } from "bullmq";
import { Queue } from "bullmq";

import type {
  IJobQueue,
  JobData,
  QueueName,
} from "../domain/interfaces/job-queue.js";

export class JobQueue implements IJobQueue {
  private readonly queues: {
    [key in QueueName]: Queue;
  };

  constructor(redisUrl: string) {
    const queueOptions = {
      defaultJobOptions: {
        removeOnComplete: {
          age: 10, // 完了速度を測定するために短時間(Prometheusのスクレイピング時間5秒と少し)で削除
        },
        removeOnFail: {
          age: 24 * 60 * 60,
        },
      },
      connection: {
        url: redisUrl,
      },
    } satisfies QueueOptions;
    this.queues = {
      resolveDid: new Queue("resolveDid", queueOptions),
      identity: new Queue("identity", queueOptions),
      commit: new Queue("commit", queueOptions),
    };
  }
  static inject = ["redisUrl"] as const;

  async add<T extends QueueName>(queueName: T, data: JobData[T]) {
    await this.queues[queueName].add(queueName, data);
  }

  getQueues() {
    return Object.values(this.queues);
  }
}
