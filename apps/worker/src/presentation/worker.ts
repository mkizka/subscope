import { AtUri } from "@atproto/api";
import { asDid } from "@atproto/did";
import type {
  CommitCreateEvent,
  CommitEvent,
  CommitUpdateEvent,
  IdentityEvent,
} from "@skyware/jetstream";
import type { WorkerOptions } from "bullmq";
import { Worker } from "bullmq";

import { upsertPostDtoFactory } from "../application/post/upsert-profile-dto.js";
import { upsertProfileDtoFactory } from "../application/profile/upsert-profile-dto.js";
import type { SyncActorUseCase } from "../application/sync-actor-use-case.js";
import type { SyncPostUseCase } from "../application/sync-post-use-case.js";
import type { SyncProfileUseCase } from "../application/sync-profile-use-case.js";
import { env } from "../shared/env.js";

const baseWorkerOptions = {
  autorun: false,
  connection: {
    url: env.REDIS_URL,
  },
} satisfies WorkerOptions;

const createSyncRecordWorker = <RecordType extends string, DTO>({
  collection: name,
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
    name,
    async (job) => {
      const uri = new AtUri(
        `at://${job.data.did}/${job.data.commit.collection}/${job.data.commit.rkey}`,
      );
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
          await delete_(uri);
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
    syncActorUseCase: SyncActorUseCase,
    syncProfileUseCase: SyncProfileUseCase,
    syncPostUseCase: SyncPostUseCase,
  ) {
    this.workers = [
      new Worker<IdentityEvent>(
        "identity",
        async (job) => {
          await syncActorUseCase.execute({
            did: asDid(job.data.identity.did),
            handle: job.data.identity.handle,
          });
        },
        baseWorkerOptions,
      ),
      createSyncRecordWorker({
        collection: "app.bsky.actor.profile",
        factory: upsertProfileDtoFactory,
        upsert: (dto) => syncProfileUseCase.execute(dto),
        delete: async (uri) => {}, // TODO: 削除処理を書く
        workerOptions: {
          concurrency: 16,
        },
      }),
      createSyncRecordWorker({
        collection: "app.bsky.feed.post",
        factory: upsertPostDtoFactory,
        upsert: (dto) => syncPostUseCase.execute(dto),
        delete: async () => {}, // TODO: 削除処理を書く
      }),
    ];
  }
  static inject = [
    "syncActorUseCase",
    "syncProfileUseCase",
    "syncPostUseCase",
  ] as const;

  async start() {
    await Promise.all(this.workers.map((worker) => worker.run()));
  }
}
