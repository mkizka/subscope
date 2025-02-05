import type { Did } from "@atproto/did";
import {
  Actor,
  type IJobQueue,
  type TransactionContext,
} from "@dawn/common/domain";
import type { Handle } from "@dawn/common/utils";

import type { IActorRepository } from "../interfaces/actor-repository.js";

export class IndexActorService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly jobQueue: IJobQueue,
  ) {}
  static inject = ["actorRepository", "jobQueue"] as const;

  async upsert({
    ctx,
    did,
    handle,
  }: {
    ctx: TransactionContext;
    did: Did;
    handle?: Handle;
  }) {
    const actor = new Actor({ did, handle });
    await this.actorRepository.createOrUpdate({ ctx, actor });
    if (!handle) {
      // await this.jobQueue.add("resolveDid", did);
    }
  }
}
