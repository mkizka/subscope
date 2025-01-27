import { Queue } from "bullmq";

import { env } from "../shared/env.js";

const queueOptions = {
  connection: {
    url: env.REDIS_URL,
  },
};

export const queues = {
  identity: new Queue("identity", queueOptions),
  "app.bsky.actor.profile": new Queue("app.bsky.actor.profile", queueOptions),
  "app.bsky.feed.post": new Queue("app.bsky.feed.post", queueOptions),
};

export class QueueService {
  async addTask(name: keyof typeof queues, data: unknown) {
    await queues[name].add(name, data, {
      removeOnComplete: {
        age: 10, // 完了速度を測定するために短時間(Prometheusのスクレイピング時間5秒と少し)で削除
      },
      removeOnFail: {
        age: 24 * 60 * 60,
      },
    });
  }
}
