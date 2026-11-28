import type { JobData } from "@repo/common/interface";
import type { BackoffStrategy, Processor, WorkerOptions } from "bullmq";
import { Worker } from "bullmq";

import { aggregateAccountStatsCommandFactory } from "../application/use-cases/async/aggregate-account-stats-command.js";
import type { AggregateAccountStatsUseCase } from "../application/use-cases/async/aggregate-account-stats-use-case.js";
import type { AggregatePostStatsUseCase } from "../application/use-cases/async/aggregate-post-stats-use-case.js";
import type { CheckBackfillUseCase } from "../application/use-cases/async/check-backfill-use-case.js";
import type { FetchRecordUseCase } from "../application/use-cases/async/fetch-record-use-case.js";
import type { ResolveDidUseCase } from "../application/use-cases/async/resolve-did-use-case.js";
import type { SendPushNotificationUseCase } from "../application/use-cases/async/send-push-notification-use-case.js";
import type { SyncAccountKindUseCase } from "../application/use-cases/async/sync-account-kind-use-case.js";
import type { Env } from "../shared/env.js";
import { createJobLogger } from "../shared/job.js";

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;

// prettier-ignore
const RETRY_DELAYS = [
  10 * SECONDS,
  60 * SECONDS,
  60 * MINUTES,
  24 * HOURS,
];

const backoffStrategy: BackoffStrategy = (attemptsMade) => {
  const delay = RETRY_DELAYS[attemptsMade - 1];
  if (delay === undefined) {
    throw new Error(
      `Retry attempt ${attemptsMade} exceeds maximum retries (${RETRY_DELAYS.length})`,
    );
  }
  return delay;
};

export class SyncWorker {
  private readonly workers: Worker[];

  constructor(deps: {
    resolveDidUseCase: ResolveDidUseCase;
    fetchRecordUseCase: FetchRecordUseCase;
    aggregatePostStatsUseCase: AggregatePostStatsUseCase;
    aggregateAccountStatsUseCase: AggregateAccountStatsUseCase;
    syncAccountKindUseCase: SyncAccountKindUseCase;
    checkBackfillUseCase: CheckBackfillUseCase;
    sendPushNotificationUseCase: SendPushNotificationUseCase;
    env: Pick<Env, "REDIS_URL">;
  }) {
    const createWorker = <T extends keyof JobData>({
      name,
      process,
      options,
    }: {
      name: T;
      process: Processor<JobData[T], void>;
      options?: Omit<WorkerOptions, "connection" | "autorun">;
    }) => {
      return new Worker<JobData[T]>(name, process, {
        autorun: false,
        connection: {
          url: deps.env.REDIS_URL,
        },
        settings: {
          backoffStrategy,
        },
        ...options,
      });
    };
    this.workers = [
      createWorker({
        name: "resolveDid",
        process: async (job) => {
          await deps.resolveDidUseCase.execute(job.data);
        },
        options: {
          concurrency: 8,
          limiter: {
            max: 4, // plc.directoryの負荷を抑えるためにrpsを制限
            duration: 1000,
          },
        },
      }),
      createWorker({
        name: "fetchRecord",
        process: async (job) => {
          await deps.fetchRecordUseCase.execute({
            uri: job.data.uri,
            depth: job.data.depth,
            live: job.data.live,
            jobLogger: createJobLogger(job),
          });
        },
        options: {
          concurrency: 20,
          limiter: {
            max: 10, // PDSの負荷を抑えるためにrpsを制限
            duration: 1000,
          },
        },
      }),
      createWorker({
        name: "aggregatePostStats",
        process: async () => {
          await deps.aggregatePostStatsUseCase.execute();
        },
      }),
      createWorker({
        name: "aggregateAccountStats",
        process: async (job) => {
          const command = aggregateAccountStatsCommandFactory({
            data: job.data,
            jobLogger: createJobLogger(job),
          });
          await deps.aggregateAccountStatsUseCase.execute(command);
        },
        options: { concurrency: 16 },
      }),
      createWorker({
        name: "syncAccountKind",
        process: async (job) => {
          await deps.syncAccountKindUseCase.execute(job.data);
        },
        options: { concurrency: 8 },
      }),
      createWorker({
        name: "checkBackfill",
        process: async (job) => {
          await deps.checkBackfillUseCase.execute(job.data);
        },
      }),
      createWorker({
        name: "sendPushNotification",
        process: async (job) => {
          await deps.sendPushNotificationUseCase.execute({
            ...job.data,
            jobLogger: createJobLogger(job),
          });
        },
        options: { concurrency: 16 },
      }),
    ];
  }

  async start() {
    await Promise.all(this.workers.map((worker) => worker.run()));
  }

  async stop() {
    await Promise.all(this.workers.map((worker) => worker.close()));
  }
}
