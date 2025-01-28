import type { ITransactionManager } from "@dawn/common/domain";
import { Profile } from "@dawn/common/domain";

import type { ActorService } from "../../domain/actor-service.js";
import type { IActorRepository } from "../interfaces/actor-repository.js";
import type { IProfileRepository } from "../interfaces/profile-repository.js";
import type { UpsertProfileDto } from "./upsert-profile-dto.js";

export class UpsertProfileUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly actorService: ActorService,
    private readonly actorRepository: IActorRepository,
    private readonly profileRepository: IProfileRepository,
  ) {}
  static inject = [
    "transactionManager",
    "actorService",
    "actorRepository",
    "profileRepository",
  ] as const;

  async execute(dto: UpsertProfileDto) {
    await this.transactionManager.transaction(async (ctx) => {
      const exists = await this.actorRepository.exists({ ctx, did: dto.did });
      if (!exists) {
        const newActor = await this.actorService.resolveActor(dto.did);
        await this.actorRepository.createOrUpdate({ ctx, actor: newActor });
      }
      const profile = new Profile(dto);
      await this.profileRepository.createOrUpdate({ ctx, profile });
    });
  }
}
