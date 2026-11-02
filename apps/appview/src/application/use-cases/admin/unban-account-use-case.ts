import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/domain";

import type { IAccountRepository } from "../../../application/interfaces/account-repository.js";

export class NotBannedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotBanned";
  }
}

export class UnbanAccountUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(params: { did: Did }): Promise<void> {
    const account = await this.accountRepository.find(params.did);
    if (!account?.isBanned) {
      throw new NotBannedError("Account is not banned");
    }

    account.unban();
    await this.transactionManager.transaction((ctx) =>
      this.accountRepository.save({ ctx, account }),
    );
  }
}
