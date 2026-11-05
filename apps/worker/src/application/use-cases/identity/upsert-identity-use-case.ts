import type { ITransactionManager } from "@repo/common/interface";

import type { IndexAccountService } from "../../services/index-account-service.js";
import type { ResolveDidUseCase } from "../async/resolve-did-use-case.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

export class UpsertIdentityUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly indexAccountService: IndexAccountService,
    private readonly resolveDidUseCase: ResolveDidUseCase,
  ) {}

  async execute(command: UpsertIdentityCommand) {
    if (command.status === "deleted") {
      await this.transactionManager.transaction((ctx) =>
        this.indexAccountService.delete({ ctx, did: command.did }),
      );
      return;
    }
    const handle = command.handle;
    if (!handle) {
      return;
    }
    await this.transactionManager.transaction((ctx) =>
      this.indexAccountService.upsert({
        ctx,
        did: command.did,
        handle,
        status: command.status,
        live: true,
      }),
    );
    if (handle === "handle.invalid") {
      await this.resolveDidUseCase.execute(command.did);
    }
  }
}
