import type { DatabaseClient } from "@dawn/common/domain";
import { Actor } from "@dawn/common/domain";

import type { ActorService } from "../../domain/actor-service.js";
import type { IActorRepository } from "../interfaces/actor-repository.js";
import type { UpsertIdentityDto } from "./upsert-identity-dto.js";

export class UpsertIdentityUseCase {
  constructor(
    private readonly actorService: ActorService,
    private readonly actorRepository: IActorRepository,
    private readonly db: DatabaseClient,
  ) {}
  static inject = ["actorService", "actorRepository", "db"] as const;

  async execute(dto: UpsertIdentityDto) {
    const actor = dto.handle
      ? new Actor({ did: dto.did, handle: dto.handle })
      : await this.actorService.resolveActor(dto.did);
    await this.actorRepository.createOrUpdate({ ctx: { db: this.db }, actor });
  }
}
