import { Queue } from "bullmq";
const createQueueOptionsBuilder = (redisUrl) => (jobOptions) => ({
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
};
export class JobQueue {
  queues;
  constructor(redisUrl) {
    const queueOptions = createQueueOptionsBuilder(redisUrl);
    this.queues = {
      resolveDid: new Queue("resolveDid", queueOptions(withRetry)),
      fetchRecord: new Queue("fetchRecord", queueOptions(withRetry)),
      identity: new Queue("identity", queueOptions(withRetry)),
      commit: new Queue("commit", queueOptions(withRetry)),
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
  async add({ queueName, jobName, data, options }) {
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
