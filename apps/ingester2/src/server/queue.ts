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
};

export class QueueService {
  async addTask(name: keyof typeof queues, data: unknown) {
    await queues[name].add(name, data);
  }
}
