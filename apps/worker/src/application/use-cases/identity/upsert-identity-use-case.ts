import type { ITransactionManager } from "@repo/common/interface";

import { Origin } from "../../../domain/origin.js";
import type { IndexAccountService } from "../../services/index-account-service.js";
import type { RelatedRecordService } from "../../services/related-record-service.js";
import type { ResolveDidService } from "../../services/resolve-did-service.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

export class UpsertIdentityUseCase {
  constructor(
    private readonly deps: {
      transactionManager: ITransactionManager;
      indexAccountService: IndexAccountService;
      relatedRecordService: RelatedRecordService;
      resolveDidService: ResolveDidService;
    },
  ) {}

  async execute(command: UpsertIdentityCommand) {
    if (command.status === "deleted") {
      await this.deps.transactionManager.transaction((ctx) =>
        this.deps.indexAccountService.delete({ ctx, did: command.did }),
      );
      return;
    }
    const handle = command.handle;
    if (!handle) {
      return;
    }
    await this.deps.transactionManager.transaction(async (ctx) => {
      await this.deps.indexAccountService.upsert({
        ctx,
        did: command.did,
        handle,
        status: command.status,
      });
      await this.deps.relatedRecordService.requestAccount({
        ctx,
        origin: Origin.live(),
        did: command.did,
      });
    });
    if (handle === "handle.invalid") {
      await this.deps.resolveDidService.resolve(command.did);
    }
  }
}
