import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type {
  CommitCreateEvent,
  CommitEvent,
  CommitUpdateEvent,
  IdentityEvent,
} from "@skyware/jetstream";
import type { WorkerOptions } from "bullmq";
import { Worker } from "bullmq";

import type { UpsertIdentityUseCase } from "../application/actor/upsert-identity-use-case.js";
import type { ResolveDidUseCase } from "../application/did/resolve-did-use-case.js";
import { upsertPostDtoFactory } from "../application/post/upsert-post-dto.js";
import type { UpsertPostUseCase } from "../application/post/upsert-post-use-case.js";
import { upsertProfileDtoFactory } from "../application/profile/upsert-profile-dto.js";
import type { UpsertProfileUseCase } from "../application/profile/upsert-profile-use-case.js";
import { env } from "../shared/env.js";

const baseWorkerOptions = {
  autorun: false,
  connection: {
    url: env.REDIS_URL,
  },
} satisfies WorkerOptions;

const createSyncRecordWorker = <RecordType extends string, DTO>({
  collection,
  factory,
  upsert,
  delete: delete_,
  workerOptions,
}: {
  collection: RecordType;
  factory: (
    event: CommitCreateEvent<RecordType> | CommitUpdateEvent<RecordType>,
  ) => DTO;
  upsert: (dto: DTO) => Promise<void>;
  delete: (uri: AtUri) => Promise<void>;
  workerOptions?: Partial<WorkerOptions>;
}) => {
  return new Worker<CommitEvent<RecordType>>(
    collection,
    async (job) => {
      switch (job.data.commit.operation) {
        case "create":
        case "update":
          await upsert(
            factory(
              job.data as
                | CommitCreateEvent<RecordType>
                | CommitUpdateEvent<RecordType>,
            ),
          );
          break;
        case "delete":
          await delete_(
            new AtUri(
              `at://${job.data.did}/${job.data.commit.collection}/${job.data.commit.rkey}`,
            ),
          );
          break;
      }
    },
    {
      ...baseWorkerOptions,
      ...workerOptions,
    },
  );
};

export class SyncWorker {
  private readonly workers: Worker[];

  constructor(
    upsertIdentityUseCase: UpsertIdentityUseCase,
    upsertProfileUseCase: UpsertProfileUseCase,
    upsertPostUseCase: UpsertPostUseCase,
    resolveDidUseCase: ResolveDidUseCase,
  ) {
    this.workers = [
      // atproto record events
      new Worker<IdentityEvent>(
        "identity",
        async (job) => {
          await upsertIdentityUseCase.execute({
            did: asDid(job.data.identity.did),
            handle: job.data.identity.handle,
          });
        },
        baseWorkerOptions,
      ),
      createSyncRecordWorker({
        collection: "app.bsky.actor.profile",
        factory: upsertProfileDtoFactory,
        upsert: (dto) => upsertProfileUseCase.execute(dto),
        delete: async (uri) => {}, // TODO: 削除処理を書く
      }),
      createSyncRecordWorker({
        collection: "app.bsky.feed.post",
        factory: upsertPostDtoFactory,
        upsert: (dto) => upsertPostUseCase.execute(dto),
        delete: async () => {}, // TODO: 削除処理を書く
        workerOptions: {
          concurrency: 16,
        },
      }),
      // others
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
    "upsertProfileUseCase",
    "upsertPostUseCase",
    "resolveDidUseCase",
  ] as const;

  async start() {
    await Promise.all(this.workers.map((worker) => worker.run()));
  }
}
