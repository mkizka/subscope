import type { IJobScheduler, ITransactionManager } from "@repo/common/domain";

import type { IndexActorService } from "../../services/index-actor-service.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

export class UpsertIdentityUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly indexActorService: IndexActorService,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  async execute(command: UpsertIdentityCommand) {
    if (command.status === "deleted") {
      await this.transactionManager.transaction((ctx) =>
        this.indexActorService.delete({ ctx, did: command.did }),
      );
      return;
    }
    const handle = command.handle;
    if (!handle) {
      return;
    }
    await this.transactionManager.transaction(async (ctx) => {
      await this.indexActorService.upsert({
        ctx,
        did: command.did,
        handle,
        status: command.status,
        live: true,
      });
      if (handle === "handle.invalid") {
        ctx.afterCommit(() =>
          this.jobScheduler.scheduleResolveDid(command.did, { live: true }),
        );
      }
    });
  }
}
