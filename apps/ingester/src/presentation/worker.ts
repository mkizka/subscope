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

import { upsertProfileDtoFactory } from "../application/profile/upsert-profile-dto.js";
import type { SyncActorUseCase } from "../application/sync-actor-use-case.js";
import type { SyncProfileUseCase } from "../application/sync-profile-use-case.js";
import { env } from "../shared/env.js";

const workerOptions = {
  autorun: false,
  connection: {
    url: env.REDIS_URL,
  },
} satisfies WorkerOptions;

const createSyncRecordWorker = <RecordType extends string>({
  collection: name,
  upsert,
  delete: delete_,
}: {
  collection: RecordType;
  upsert: (
    event: CommitCreateEvent<RecordType> | CommitUpdateEvent<RecordType>,
  ) => Promise<void>;
  delete: (uri: AtUri) => Promise<void>;
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
            job.data as
              | CommitCreateEvent<RecordType>
              | CommitUpdateEvent<RecordType>,
          );
          break;
        case "delete":
          await delete_(uri);
          break;
      }
    },
    workerOptions,
  );
};

export class SyncWorker {
  private readonly workers: Worker[];

  constructor(
    syncActorUseCase: SyncActorUseCase,
    syncProfileUseCase: SyncProfileUseCase,
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
        workerOptions,
      ),
      createSyncRecordWorker({
        collection: "app.bsky.actor.profile",
        upsert: (event) =>
          syncProfileUseCase.execute(upsertProfileDtoFactory(event)),
        delete: async (uri) => {}, // TODO: 削除処理を書く
      }),
    ];
  }
  static inject = ["syncActorUseCase", "syncProfileUseCase"] as const;

  async start() {
    await Promise.all(this.workers.map((worker) => worker.run()));
  }
}
