import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { IAccountRepository } from "../../../application/interfaces/account-repository.js";
import {
  NotRegisteredError,
  type UnregisterAccountService,
} from "../../service/sync/unregister-account-service.js";

export class CannotBanAdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CannotBanAdmin";
  }
}

export class BanAccountUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly accountRepository: IAccountRepository,
    private readonly unregisterAccountService: UnregisterAccountService,
  ) {}
  static inject = [
    "transactionManager",
    "accountRepository",
    "unregisterAccountService",
  ] as const;

  async execute(params: { did: Did }): Promise<void> {
    const account = await this.accountRepository.find(params.did);
    if (!account) {
      throw new NotRegisteredError("Not registered with this server");
    }
    if (account.isAdmin) {
      throw new CannotBanAdminError("Cannot ban an admin");
    }

    await this.unregisterAccountService.unregister(params.did);
    account.ban();
    await this.transactionManager.transaction((ctx) =>
      this.accountRepository.save({ ctx, account }),
    );
  }
}
