import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { UnregisterAccountService } from "../../service/sync/unregister-account-service.js";

type UnregisterAccountParams = {
  accountDid: Did;
};

export class UnregisterAccountUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly unregisterAccountService: UnregisterAccountService,
  ) {}

  async execute(params: UnregisterAccountParams): Promise<void> {
    await this.transactionManager.transaction((ctx) =>
      this.unregisterAccountService.unregister({
        ctx,
        accountDid: params.accountDid,
      }),
    );
  }
}
