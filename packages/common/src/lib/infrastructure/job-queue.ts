import type { QueueOptions } from "bullmq";
import { Queue } from "bullmq";

import type {
  IJobQueue,
  JobData,
  JobState,
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
      backfill: new Queue("backfill", queueOptions),
      temp__cleanupDatabase: new Queue("temp__cleanupDatabase", queueOptions),
    };
    this.queues.temp__cleanupDatabase
      .upsertJobScheduler(
        "temp",
        { pattern: "0 15 * * *" }, // 日本時間0時
        { name: "cleanupDatabase" },
      )
      // eslint-disable-next-line no-console
      .catch(console.error);
  }
  static inject = ["redisUrl"] as const;

  async add<T extends QueueName>({
    queueName,
    jobName,
    data,
  }: {
    queueName: T;
    jobName: string;
    data: JobData[T];
  }) {
    // TODO: 元に戻す
    if (queueName === "resolveDid") {
      return;
    }
    await this.queues[queueName].add(jobName, data);
  }

  getQueues() {
    return Object.values(this.queues);
  }

  async getJobState({
    queueName,
    jobId,
  }: {
    queueName: QueueName;
    jobId: string;
  }): Promise<JobState> {
    const state = await this.queues[queueName].getJobState(jobId);
    if (state === "completed" || state === "failed") {
      return state;
    }
    return "inProgress";
  }
}
