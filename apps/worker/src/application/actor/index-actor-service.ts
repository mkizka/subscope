import type { Did } from "@atproto/did";
import {
  Actor,
  type IJobQueue,
  type TransactionContext,
} from "@dawn/common/domain";

import type { IActorRepository } from "../interfaces/actor-repository.js";

export class IndexActorService {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly jobQueue: IJobQueue,
  ) {}
  static inject = ["actorRepository", "jobQueue"] as const;

  async upsert({ ctx, did }: { ctx: TransactionContext; did: Did }) {
    const actor = new Actor({ did });
    await this.actorRepository.createOrUpdate({ ctx, actor });
    // await this.jobQueue.add("resolveDid", did);
  }
}
