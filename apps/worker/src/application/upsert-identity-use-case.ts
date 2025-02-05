import type { ITransactionManager } from "@dawn/common/domain";

import type { IndexActorService } from "./service/index-actor-service.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

export class UpsertIdentityUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly indexActorService: IndexActorService,
  ) {}
  static inject = ["transactionManager", "indexActorService"] as const;

  async execute(command: UpsertIdentityCommand) {
    await this.transactionManager.transaction(async (ctx) => {
      await this.indexActorService.upsert({
        ctx,
        did: command.did,
        handle: command.handle,
      });
    });
  }
}
