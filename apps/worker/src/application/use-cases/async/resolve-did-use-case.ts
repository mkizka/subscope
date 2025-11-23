import type { Did } from "@atproto/did";
import type { IDidResolver } from "@repo/common/domain";
import { Actor, type DatabaseClient } from "@repo/common/domain";

import type { IActorRepository } from "../../interfaces/repositories/actor-repository.js";

export class ResolveDidUseCase {
  constructor(
    private readonly didResolver: IDidResolver,
    private readonly actorRepository: IActorRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["didResolver", "actorRepository", "db"] as const;

  async execute(did: Did) {
    const { handle } = await this.didResolver.resolve(did);

    const existingActor = await this.actorRepository.findByDid({
      ctx: { db: this.db },
      did,
    });
    const actor = existingActor ?? Actor.create({ did, indexedAt: new Date() });

    actor.updateHandle(handle);

    await this.actorRepository.upsert({
      ctx: { db: this.db },
      actor,
    });
  }
}
