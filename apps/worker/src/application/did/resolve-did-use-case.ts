import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@dawn/common/domain";

import type { ActorService } from "../../domain/actor-service.js";
import type { IActorRepository } from "../interfaces/actor-repository.js";

export class ResolveDidUseCase {
  constructor(
    private readonly actorService: ActorService,
    private readonly actorRepository: IActorRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["actorService", "actorRepository", "db"] as const;

  async execute(did: Did) {
    const resolvedActor = await this.actorService.resolveActor(did);
    await this.actorRepository.createOrUpdate({
      ctx: { db: this.db },
      actor: resolvedActor,
    });
  }
}
