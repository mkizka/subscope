import type { JobData } from "@repo/common/domain";
import type { BackoffStrategy, Processor, WorkerOptions } from "bullmq";
import { Worker } from "bullmq";

import type { AddTapRepoUseCase } from "../application/use-cases/async/add-tap-repo-use-case.js";
import { aggregateActorStatsCommandFactory } from "../application/use-cases/async/aggregate-actor-stats-command.js";
import type { AggregateActorStatsUseCase } from "../application/use-cases/async/aggregate-actor-stats-use-case.js";
import { aggregatePostStatsCommandFactory } from "../application/use-cases/async/aggregate-post-stats-command.js";
import type { AggregatePostStatsUseCase } from "../application/use-cases/async/aggregate-post-stats-use-case.js";
import type { FetchRecordUseCase } from "../application/use-cases/async/fetch-record-use-case.js";
import type { RemoveTapRepoUseCase } from "../application/use-cases/async/remove-tap-repo-use-case.js";
import type { ResolveDidUseCase } from "../application/use-cases/async/resolve-did-use-case.js";
import { indexCommitCommandFactory } from "../application/use-cases/commit/index-commit-command.js";
import type { IndexCommitUseCase } from "../application/use-cases/commit/index-commit-use-case.js";
import { upsertIdentityCommandFactory } from "../application/use-cases/identity/upsert-identity-command.js";
import type { UpsertIdentityUseCase } from "../application/use-cases/identity/upsert-identity-use-case.js";
import { env } from "../shared/env.js";
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

const createWorker = <T extends keyof JobData>(
  name: T,
  process: Processor<JobData[T], void>,
  options?: Omit<WorkerOptions, "connection" | "autorun">,
) => {
  return new Worker<JobData[T]>(name, process, {
    autorun: false,
    connection: {
      url: env.REDIS_URL,
    },
    settings: {
      backoffStrategy,
    },
    ...options,
  });
};

export class SyncWorker {
  private readonly workers: Worker[];

  constructor(
    upsertIdentityUseCase: UpsertIdentityUseCase,
    indexCommitUseCase: IndexCommitUseCase,
    resolveDidUseCase: ResolveDidUseCase,
    fetchRecordUseCase: FetchRecordUseCase,
    aggregatePostStatsUseCase: AggregatePostStatsUseCase,
    aggregateActorStatsUseCase: AggregateActorStatsUseCase,
    addTapRepoUseCase: AddTapRepoUseCase,
    removeTapRepoUseCase: RemoveTapRepoUseCase,
  ) {
    this.workers = [
      createWorker("identity", async (job) => {
        const command = upsertIdentityCommandFactory(job.data);
        await upsertIdentityUseCase.execute(command);
      }),
      createWorker(
        "commit",
        async (job) => {
          const command = indexCommitCommandFactory({
            event: job.data,
            jobLogger: createJobLogger(job),
          });
          await indexCommitUseCase.execute(command);
        },
        {
          concurrency: env.COMMIT_WORKER_CONCURRENCY,
        },
      ),
      createWorker(
        "resolveDid",
        async (job) => {
          await resolveDidUseCase.execute(job.data);
        },
        {
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
          limiter: {
            max: 10, // PDSの負荷を抑えるためにrpsを制限
            duration: 1000,
          },
        },
      ),
      createWorker("aggregatePostStats", async (job) => {
        const command = aggregatePostStatsCommandFactory({
          data: job.data,
          jobLogger: createJobLogger(job),
        });
        await aggregatePostStatsUseCase.execute(command);
      }),
      createWorker("aggregateActorStats", async (job) => {
        const command = aggregateActorStatsCommandFactory({
          data: job.data,
          jobLogger: createJobLogger(job),
        });
        await aggregateActorStatsUseCase.execute(command);
      }),
      createWorker("addTapRepo", async (job) => {
        await addTapRepoUseCase.execute(job.data);
      }),
      createWorker("removeTapRepo", async (job) => {
        await removeTapRepoUseCase.execute(job.data);
      }),
    ];
  }
  static inject = [
    "upsertIdentityUseCase",
    "indexCommitUseCase",
    "resolveDidUseCase",
    "fetchRecordUseCase",
    "aggregatePostStatsUseCase",
    "aggregateActorStatsUseCase",
    "addTapRepoUseCase",
    "removeTapRepoUseCase",
  ] as const;

  async start() {
    await Promise.all(this.workers.map((worker) => worker.run()));
  }

  async stop() {
    await Promise.all(this.workers.map((worker) => worker.close()));
  }
}
