import type { DatabaseClient } from "@dawn/common/domain";

import type { IndexActorService } from "./service/index-actor-service.js";
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
    await this.indexActorService.upsert({
      ctx: { db: this.db },
      did: command.did,
      handle: command.handle,
    });
  }
}
