import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { IAccountRepository } from "../../../application/interfaces/account-repository.js";
import { NotRegisteredError } from "../../../application/use-cases/sync/unregister-account-use-case.js";

export class CannotRevokeSelfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CannotRevokeSelf";
  }
}

export class RevokeAdminUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(params: { did: Did; requesterDid: Did }): Promise<void> {
    if (params.did === params.requesterDid) {
      throw new CannotRevokeSelfError("Cannot revoke your own admin");
    }
    const account = await this.accountRepository.find(params.did);
    if (!account) {
      throw new NotRegisteredError("Not registered with this server");
    }

    account.demoteFromAdmin();
    await this.transactionManager.transaction((ctx) =>
      this.accountRepository.save({ ctx, account }),
    );
  }
}
