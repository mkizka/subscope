import { Queue } from "bullmq";

export const queues = {
  syncProfile: new Queue("syncProfile"),
  syncIdentity: new Queue("syncIdentity"),
};

export class QueueService {
  async addTask(name: keyof typeof queues, data: unknown) {
    await queues[name].add(name, data);
  }
}
