import { Queue } from "bullmq";

import type { IQueueService } from "../../application/interfaces/queue.js";
import { env } from "../../shared/env.js";

const queueOptions = {
  connection: {
    url: env.REDIS_URL,
  },
};

export const queues: Record<string, Queue> = {
  resolveDid: new Queue("resolveDid", queueOptions),
};

export class QueueService implements IQueueService {
  async addTask(name: string, data: unknown) {
    // TODO: queueを@dawn/commonにまとめる
    await queues[name]?.add(name, data, {
      removeOnComplete: {
        age: 10, // 完了速度を測定するために短時間(Prometheusのスクレイピング時間5秒と少し)で削除
      },
      removeOnFail: {
        age: 24 * 60 * 60,
      },
    });
  }
}
