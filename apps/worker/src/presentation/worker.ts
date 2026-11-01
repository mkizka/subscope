import type { JobData } from "@repo/common/domain";
import type { BackoffStrategy, Processor, WorkerOptions } from "bullmq";
import { Worker } from "bullmq";

import { aggregateActorStatsCommandFactory } from "../application/use-cases/async/aggregate-actor-stats-command.js";
import type { AggregateActorStatsUseCase } from "../application/use-cases/async/aggregate-actor-stats-use-case.js";
import type { AggregatePostStatsUseCase } from "../application/use-cases/async/aggregate-post-stats-use-case.js";
import type { FetchRecordUseCase } from "../application/use-cases/async/fetch-record-use-case.js";
import type { ResolveDidUseCase } from "../application/use-cases/async/resolve-did-use-case.js";
import type { SyncTapRepoUseCase } from "../application/use-cases/async/sync-tap-repo-use-case.js";
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

  constructor(
    resolveDidUseCase: ResolveDidUseCase,
    fetchRecordUseCase: FetchRecordUseCase,
    aggregatePostStatsUseCase: AggregatePostStatsUseCase,
    aggregateActorStatsUseCase: AggregateActorStatsUseCase,
    syncTapRepoUseCase: SyncTapRepoUseCase,
    redisUrl: string,
  ) {
    const createWorker = <T extends keyof JobData>(
      name: T,
      process: Processor<JobData[T], void>,
      options?: Omit<WorkerOptions, "connection" | "autorun">,
    ) => {
      return new Worker<JobData[T]>(name, process, {
        autorun: false,
        connection: {
          url: redisUrl,
        },
        settings: {
          backoffStrategy,
        },
        ...options,
      });
    };
    this.workers = [
      createWorker(
        "resolveDid",
        async (job) => {
          await resolveDidUseCase.execute(job.data);
        },
        {
          concurrency: 8,
          limiter: {
            max: 4, // plc.directoryの負荷を抑えるためにrpsを制限
            duration: 1000,
          },
        },
      ),
      createWorker(
        "fetchRecord",
        async (job) => {
          await fetchRecordUseCase.execute({
            uri: job.data.uri,
            depth: job.data.depth,
            live: job.data.live,
            jobLogger: createJobLogger(job),
          });
        },
        {
          concurrency: 20,
          limiter: {
            max: 10, // PDSの負荷を抑えるためにrpsを制限
            duration: 1000,
          },
        },
      ),
      createWorker("aggregatePostStats", async () => {
        await aggregatePostStatsUseCase.execute();
      }),
      createWorker(
        "aggregateActorStats",
        async (job) => {
          const command = aggregateActorStatsCommandFactory({
            data: job.data,
            jobLogger: createJobLogger(job),
          });
          await aggregateActorStatsUseCase.execute(command);
        },
        { concurrency: 16 },
      ),
      createWorker("syncTapRepo", async (job) => {
        await syncTapRepoUseCase.execute(job.data);
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
