import type { Did } from "@atproto/did";
import { Actor, type TransactionContext } from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/actor-repository.js";

export class IndexActorService {
  constructor(private readonly actorRepository: IActorRepository) {}
  static inject = ["actorRepository"] as const;

  async upsertActor({
    ctx,
    did,
  }: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<Actor> {
    const existingActor = await this.actorRepository.findByDid(did);
    if (existingActor) {
      return existingActor;
    }

    const actor = Actor.create({ did });
    await this.actorRepository.upsert({ ctx, actor });
    return actor;
  }
}
