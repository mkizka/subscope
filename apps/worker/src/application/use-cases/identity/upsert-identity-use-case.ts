import type { ITransactionManager } from "@repo/common/domain";

import type { IndexActorService } from "../../services/index-actor-service.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

export class UpsertIdentityUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly indexActorService: IndexActorService,
  ) {}
  static inject = ["transactionManager", "indexActorService"] as const;

  async execute(command: UpsertIdentityCommand) {
    const handle = command.handle;
    if (!handle) {
      return;
    }
    await this.transactionManager.transaction((ctx) =>
      this.indexActorService.upsert({
        ctx,
        did: command.did,
        handle,
        live: true,
      }),
    );
  }
}
