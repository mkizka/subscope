import type { ITransactionManager } from "@dawn/common/domain";
import { Actor, Profile } from "@dawn/common/domain";

import type { ActorService } from "../../domain/actor-service.js";
import type { IActorRepository } from "../interfaces/actor-repository.js";
import type { IProfileRepository } from "../interfaces/profile-repository.js";
import type { IQueueService } from "../interfaces/queue.js";
import type { UpsertProfileDto } from "./upsert-profile-dto.js";

export class UpsertProfileUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly actorService: ActorService,
    private readonly actorRepository: IActorRepository,
    private readonly profileRepository: IProfileRepository,
    private readonly queue: IQueueService,
  ) {}
  static inject = [
    "transactionManager",
    "actorService",
    "actorRepository",
    "profileRepository",
    "queue",
  ] as const;

  async execute(dto: UpsertProfileDto) {
    await this.transactionManager.transaction(async (ctx) => {
      const exists = await this.actorRepository.exists({ ctx, did: dto.did });
      if (!exists) {
        const actor = new Actor({ did: dto.did });
        await Promise.all([
          this.queue.addTask("resolveDid", dto.did),
          this.actorRepository.createOrUpdate({ ctx, actor }),
        ]);
      }
      const profile = new Profile(dto);
      await this.profileRepository.createOrUpdate({ ctx, profile });
    });
  }
}
