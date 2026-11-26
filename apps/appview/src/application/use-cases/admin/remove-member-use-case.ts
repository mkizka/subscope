import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { IAccountRepository } from "../../../application/interfaces/account-repository.js";
import {
  NotMemberError,
  type UnregisterAccountService,
} from "../../service/sync/unregister-account-service.js";

export class CannotRemoveAdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CannotRemoveAdmin";
  }
}

export class RemoveMemberUseCase {
  constructor(
    private readonly deps: {
      transactionManager: ITransactionManager;
      accountRepository: IAccountRepository;
      unregisterAccountService: UnregisterAccountService;
    },
  ) {}
  static inject = [
    "transactionManager",
    "accountRepository",
    "unregisterAccountService",
  ] as const;

  async execute(params: { did: Did }): Promise<void> {
    const account = await this.deps.accountRepository.find(params.did);
    if (!account) {
      throw new NotMemberError("Not a member of this server");
    }
    if (account.isAdmin) {
      throw new CannotRemoveAdminError("Cannot remove an admin");
    }

    await this.deps.transactionManager.transaction(async (ctx) => {
      await this.deps.unregisterAccountService.unregister({
        ctx,
        accountDid: params.did,
      });
    });
  }
}
