import type { Did } from "@atproto/did";
import type {
  DatabaseClient,
  IIndexTargetRepository,
} from "@repo/common/domain";

import type { IndexActorService } from "../../services/index-actor-service.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

export class UpsertIdentityUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly indexActorService: IndexActorService,
    private readonly indexTargetRepository: IIndexTargetRepository,
  ) {}
  static inject = ["db", "indexActorService", "indexTargetRepository"] as const;

  async execute(command: UpsertIdentityCommand) {
    if (!command.handle) {
      return;
    }
    const ctx = { db: this.db };
    const shouldIndex = await this.shouldIndexActor(command.did);
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

  private async shouldIndexActor(did: Did): Promise<boolean> {
    return this.indexTargetRepository.isTrackedActor(did);
  }
}
