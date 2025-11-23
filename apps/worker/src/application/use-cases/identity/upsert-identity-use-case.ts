import type { Did } from "@atproto/did";
import type { DatabaseClient, TransactionContext } from "@repo/common/domain";

import type { ITrackedActorRepository } from "../../interfaces/repositories/tracked-actor-repository.js";
import type { IndexActorService } from "../../services/index-actor-service.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

export class UpsertIdentityUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly indexActorService: IndexActorService,
    private readonly trackedActorRepository: ITrackedActorRepository,
  ) {}
  static inject = [
    "db",
    "indexActorService",
    "trackedActorRepository",
  ] as const;

  async execute(command: UpsertIdentityCommand) {
    if (!command.handle) {
      return;
    }
    const ctx = { db: this.db };
    const shouldIndex = await this.shouldIndexActor(ctx, command.did);
    if (!shouldIndex) {
      return;
    }
    await this.indexActorService.upsert({
      ctx,
      did: command.did,
      handle: command.handle,
      indexedAt: command.indexedAt,
    });
  }

  private async shouldIndexActor(
    ctx: TransactionContext,
    did: Did,
  ): Promise<boolean> {
    return this.trackedActorRepository.isTrackedActor(ctx, did);
  }
}
