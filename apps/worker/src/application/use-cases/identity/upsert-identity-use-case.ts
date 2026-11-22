import type { ITransactionManager } from "@repo/common/interface";

import type { FetchPolicyService } from "../../services/fetch-policy-service.js";
import type { IndexAccountService } from "../../services/index-account-service.js";
import type { IndexJobService } from "../../services/index-job-service.js";
import type { ResolveDidService } from "../../services/resolve-did-service.js";
import type { UpsertIdentityCommand } from "./upsert-identity-command.js";

export class UpsertIdentityUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly indexAccountService: IndexAccountService,
    private readonly resolveDidService: ResolveDidService,
    private readonly fetchPolicyService: FetchPolicyService,
    private readonly indexJobService: IndexJobService,
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
    await this.transactionManager.transaction(async (ctx) => {
      await this.indexAccountService.upsert({
        ctx,
        did: command.did,
        handle,
        status: command.status,
      });
      const targets = await this.fetchPolicyService.targetsForAccount({
        ctx,
        did: command.did,
      });
      this.indexJobService.schedule({ ctx, priority: "high", fetch: targets });
    });
    if (handle === "handle.invalid") {
      await this.resolveDidService.resolve(command.did);
    }
  }
}
