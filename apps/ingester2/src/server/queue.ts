import type { ILoggerManager, Logger } from "@dawn/common/domain";
import { Queue } from "bullmq";

export const queues = {
  syncProfile: new Queue("syncProfile"),
  syncIdentity: new Queue("syncIdentity"),
};

export class QueueService {
  private readonly logger: Logger;

  constructor(loggerManager: ILoggerManager) {
    this.logger = loggerManager.createLogger("QueueService");
  }
  static inject = ["loggerManager"] as const;

  async addTask(name: keyof typeof queues, data: unknown) {
    this.logger.debug({ name, data }, "add task to queue");
    await queues[name].add(name, data);
  }
}
