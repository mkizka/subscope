import type { Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import {
  Actor,
  type IJobQueue,
  type TransactionContext,
} from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/actor-repository.js";

export class IndexActorService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly jobQueue: IJobQueue,
  ) {}
  static inject = ["actorRepository", "jobQueue"] as const;

  async upsertActor({
    ctx,
    did,
  }: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<Actor> {
    const existingActor = await this.actorRepository.findByDid(did);
    const actor = existingActor ?? Actor.create({ did });

    await this.actorRepository.upsert({ ctx, actor });

    if (!existingActor) {
      const profileUri = AtUri.make(did, "app.bsky.actor.profile", "self");
      await this.jobQueue.add({
        queueName: "fetchRecord",
        jobName: profileUri.toString(),
        data: {
          uri: profileUri.toString(),
          depth: 0,
          live: false,
        },
        options: {
          jobId: profileUri.toString(),
          priority: 1,
        },
      });
    }

    return actor;
  }
}
