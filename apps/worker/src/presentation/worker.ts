import type { JobData } from "@repo/common/domain";
import type { Processor, WorkerOptions } from "bullmq";
import { Worker } from "bullmq";

import { handleAccountCommandFactory } from "../application/use-cases/account/handle-account-command.js";
import type { HandleAccountUseCase } from "../application/use-cases/account/handle-account-use-case.js";
import type { BackfillUseCase } from "../application/use-cases/async/backfill-use-case.js";
import type { FetchRecordUseCase } from "../application/use-cases/async/fetch-record-use-case.js";
import type { ResolveDidUseCase } from "../application/use-cases/async/resolve-did-use-case.js";
import { indexCommitCommandFactory } from "../application/use-cases/commit/index-commit-command.js";
import type { IndexCommitUseCase } from "../application/use-cases/commit/index-commit-use-case.js";
import { upsertIdentityCommandFactory } from "../application/use-cases/identity/upsert-identity-command.js";
import type { UpsertIdentityUseCase } from "../application/use-cases/identity/upsert-identity-use-case.js";
import { env } from "../shared/env.js";
import { createJobLogger } from "../shared/job.js";

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
    ...options,
  });
};

export class SyncWorker {
  private readonly workers: Worker[];

  constructor(
    upsertIdentityUseCase: UpsertIdentityUseCase,
    indexCommitUseCase: IndexCommitUseCase,
    backfillUseCase: BackfillUseCase,
    resolveDidUseCase: ResolveDidUseCase,
    fetchRecordUseCase: FetchRecordUseCase,
    handleAccountUseCase: HandleAccountUseCase,
  ) {
    this.workers = [
      createWorker("identity", async (job) => {
        const command = upsertIdentityCommandFactory(job.data);
        await upsertIdentityUseCase.execute(command);
      }),
      createWorker("account", async (job) => {
        const command = handleAccountCommandFactory(job.data);
        await handleAccountUseCase.execute(command);
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
          concurrency: 32,
        },
      ),
      createWorker("backfill", async (job) => {
        await backfillUseCase.execute({
          did: job.data,
          jobLogger: createJobLogger(job),
        });
      }),
      createWorker(
        "resolveDid",
        async (job) => {
          await resolveDidUseCase.execute(job.data);
        },
        {
          limiter: {
            max: 10, // plc.directoryの負荷を抑えるためにrpsを制限
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
    ];
  }
  static inject = [
    "upsertIdentityUseCase",
    "indexCommitUseCase",
    "backfillUseCase",
    "resolveDidUseCase",
    "fetchRecordUseCase",
    "handleAccountUseCase",
  ] as const;

  async start() {
    await Promise.all(this.workers.map((worker) => worker.run()));
  }

  async stop() {
    await Promise.all(this.workers.map((worker) => worker.close()));
  }
}
