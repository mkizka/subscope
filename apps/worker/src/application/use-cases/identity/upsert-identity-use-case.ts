import type { DatabaseClient } from "@repo/common/domain";

import type { IndexActorService } from "../../services/index-actor-service.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

export class UpsertIdentityUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly indexActorService: IndexActorService,
  ) {}
  static inject = ["db", "indexActorService"] as const;

  async execute(command: UpsertIdentityCommand) {
    if (!command.handle) {
      return;
    }
    const ctx = { db: this.db };
    await this.indexActorService.upsert({
      ctx,
      did: command.did,
      handle: command.handle,
    });
  }
}
