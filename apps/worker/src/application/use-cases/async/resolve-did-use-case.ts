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
    await this.actorRepository.upsert({
      ctx: { db: this.db },
      actor: new Actor({ did, handle, indexedAt: new Date() }),
    });
  }
}
