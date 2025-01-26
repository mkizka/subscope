import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@dawn/common/domain";
import { Actor } from "@dawn/common/domain";

import type { ActorService } from "../domain/actor-service.js";
import type { IActorRepository } from "./interfaces/actor-repository.js";

export class SyncActorUseCase {
  constructor(
    private readonly actorService: ActorService,
    private readonly actorRepository: IActorRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["actorService", "actorRepository", "db"] as const;

  async execute(dto: { did: Did; handle?: string }) {
    const actor = dto.handle
      ? new Actor({ did: dto.did, handle: dto.handle })
      : await this.actorService.resolveActor(dto.did);
    await this.actorRepository.createOrUpdate({ ctx: { db: this.db }, actor });
  }
}
