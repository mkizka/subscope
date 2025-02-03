import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { CommitEvent, IdentityEvent } from "@skyware/jetstream";
import type { WorkerOptions } from "bullmq";
import { Worker } from "bullmq";

import type { UpsertIdentityUseCase } from "../application/actor/upsert-identity-use-case.js";
import type { ResolveDidUseCase } from "../application/did/resolve-did-use-case.js";
import { indexCommitCommandFactory } from "../application/index-commit-command.js";
import type { IndexCommitUseCase } from "../application/index-commit-use-case.js";
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
  ) {
    this.workers = [
      new Worker<IdentityEvent>(
        "identity",
        (job) =>
          upsertIdentityUseCase.execute({
            did: asDid(job.data.identity.did),
            handle: job.data.identity.handle,
          }),
        baseWorkerOptions,
      ),
      new Worker<CommitEvent<"app.bsky.feed.post" | "app.bsky.actor.profile">>(
        "commit",
        async (job) => {
          const command = indexCommitCommandFactory(job.data);
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
            max: 5, // plc.directoryの負荷を抑えるためにrpsを制限
            duration: 1000,
          },
        },
      ),
    ];
  }
  static inject = [
    "upsertIdentityUseCase",
    "indexCommitUseCase",
    "resolveDidUseCase",
  ] as const;

  async start() {
    await Promise.all(this.workers.map((worker) => worker.run()));
  }
}
