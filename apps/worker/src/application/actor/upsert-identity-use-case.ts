import type { IJobQueue, ITransactionManager } from "@dawn/common/domain";
import { Actor } from "@dawn/common/domain";

import type { IActorRepository } from "../interfaces/actor-repository.js";
import type { UpsertIdentityDto } from "./upsert-identity-dto.js";

export class UpsertIdentityUseCase {
  constructor(
    private readonly actorRepository: IActorRepository,
    private readonly transactionManager: ITransactionManager,
    private readonly jobQueue: IJobQueue,
  ) {}
  static inject = [
    "actorRepository",
    "transactionManager",
    "jobQueue",
  ] as const;

  async execute(dto: UpsertIdentityDto) {
    await this.transactionManager.transaction(async (ctx) => {
      const exists = await this.actorRepository.exists({
        ctx,
        did: dto.did,
      });
      if (!exists && !dto.handle) {
        await this.jobQueue.add("resolveDid", dto.did);
      }
      await this.actorRepository.createOrUpdate({
        ctx,
        actor: new Actor(dto),
      });
    });
  }
}
