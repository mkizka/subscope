import type { Did } from "@atproto/did";
import type { SupportedCollection } from "@dawn/common/utils";
import type { CommitEvent, IdentityEvent } from "@skyware/jetstream";
import type { WorkerOptions } from "bullmq";
import { Worker } from "bullmq";

import { indexCommitCommandFactory } from "../application/index-commit-command.js";
import type { IndexCommitUseCase } from "../application/index-commit-use-case.js";
import type { ResolveDidUseCase } from "../application/resolve-did-use-case.js";
import type { Temp__CleanupDatabaseUseCase } from "../application/temp__cleanup-database-usecase.js";
import { upsertIdentityCommandFactory } from "../application/upsert-identity-command.js";
import type { UpsertIdentityUseCase } from "../application/upsert-identity-use-case.js";
import { env } from "../shared/env.js";

const baseWorkerOptions = {
  autorun: false,
  connection: {
    url: env.REDIS_URL,
  },
} satisfies WorkerOptions;

export class SyncWorker {
  private readonly workers: Worker[];

  constructor(
    upsertIdentityUseCase: UpsertIdentityUseCase,
    indexCommitUseCase: IndexCommitUseCase,
    resolveDidUseCase: ResolveDidUseCase,
    temp__cleanupDatabaseUseCase: Temp__CleanupDatabaseUseCase,
  ) {
    this.workers = [
      new Worker<IdentityEvent>(
        "identity",
        async (job) => {
          const command = upsertIdentityCommandFactory(job.data);
          await upsertIdentityUseCase.execute(command);
        },
        baseWorkerOptions,
      ),
      new Worker<CommitEvent<SupportedCollection>>(
        "commit",
        async (job) => {
          const command = indexCommitCommandFactory({
            event: job.data,
            log: (message: string) => job.log(message),
          });
          await indexCommitUseCase.execute(command);
        },
        {
          ...baseWorkerOptions,
          concurrency: 16,
        },
      ),
      new Worker<Did>(
        "resolveDid",
        (job) => resolveDidUseCase.execute(job.data),
        {
          ...baseWorkerOptions,
          limiter: {
            max: 10, // plc.directoryの負荷を抑えるためにrpsを制限
            duration: 1000,
          },
        },
      ),
      // 開発用
      new Worker(
        "temp__cleanupDatabase",
        async (job) => {
          const jobLogger = { log: (message: string) => job.log(message) };
          await temp__cleanupDatabaseUseCase.execute(jobLogger);
        },
        baseWorkerOptions,
      ),
    ];
  }
  static inject = [
    "upsertIdentityUseCase",
    "indexCommitUseCase",
    "resolveDidUseCase",
    "temp__cleanupDatabaseUseCase",
  ] as const;

  async start() {
    await Promise.all(this.workers.map((worker) => worker.run()));
  }
}
