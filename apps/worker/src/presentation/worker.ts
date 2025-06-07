import type { Did } from "@atproto/did";
import type { SupportedCollection } from "@dawn/common/utils";
import type { CommitEvent, IdentityEvent } from "@skyware/jetstream";
import type { WorkerOptions } from "bullmq";
import { Worker } from "bullmq";

import type { BackfillUseCase } from "../application/use-cases/async/backfill-use-case.js";
import type { Temp__CleanupDatabaseUseCase } from "../application/use-cases/async/cleanup-database-use-case.js";
import type { FetchProfileUseCase } from "../application/use-cases/async/fetch-profile-use-case.js";
import type { ResolveDidUseCase } from "../application/use-cases/async/resolve-did-use-case.js";
import { indexCommitCommandFactory } from "../application/use-cases/commit/index-commit-command.js";
import type { IndexCommitUseCase } from "../application/use-cases/commit/index-commit-use-case.js";
import { upsertIdentityCommandFactory } from "../application/use-cases/identity/upsert-identity-command.js";
import type { UpsertIdentityUseCase } from "../application/use-cases/identity/upsert-identity-use-case.js";
import { env } from "../shared/env.js";
import { createJobLogger } from "../shared/job.js";

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
    backfillUseCase: BackfillUseCase,
    resolveDidUseCase: ResolveDidUseCase,
    fetchProfileUseCase: FetchProfileUseCase,
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
            jobLogger: createJobLogger(job),
          });
          await indexCommitUseCase.execute(command);
        },
        {
          ...baseWorkerOptions,
          concurrency: 16,
        },
      ),
      new Worker<Did>(
        "backfill",
        async (job) => {
          await backfillUseCase.execute({
            did: job.data,
            jobLogger: createJobLogger(job),
          });
        },
        baseWorkerOptions,
      ),
      new Worker<Did>(
        "resolveDid",
        async (job) => {
          await resolveDidUseCase.execute(job.data);
        },
        {
          ...baseWorkerOptions,
          limiter: {
            max: 10, // plc.directoryの負荷を抑えるためにrpsを制限
            duration: 1000,
          },
        },
      ),
      new Worker<Did>(
        "fetchProfile",
        async (job) => {
          await fetchProfileUseCase.execute({
            did: job.data,
            jobLogger: createJobLogger(job),
          });
        },
        {
          ...baseWorkerOptions,
          limiter: {
            max: 10, // PDSの負荷を抑えるためにrpsを制限
            duration: 1000,
          },
        },
      ),
      // 開発用
      new Worker(
        "temp__cleanupDatabase",
        async (job) => {
          const jobLogger = createJobLogger(job);
          await temp__cleanupDatabaseUseCase.execute(jobLogger);
        },
        {
          ...baseWorkerOptions,
          stalledInterval: 5 * 60 * 1000,
        },
      ),
    ];
  }
  static inject = [
    "upsertIdentityUseCase",
    "indexCommitUseCase",
    "backfillUseCase",
    "resolveDidUseCase",
    "fetchProfileUseCase",
    "temp__cleanupDatabaseUseCase",
  ] as const;

  async start() {
    await Promise.all(this.workers.map((worker) => worker.run()));
  }
}
