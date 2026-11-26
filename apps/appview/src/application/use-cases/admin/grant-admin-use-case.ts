import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/interface";

import type { IAccountRepository } from "../../../application/interfaces/account-repository.js";
import type { IRegistrationRepository } from "../../../application/interfaces/registration-repository.js";
import { NotMemberError } from "../../service/sync/unregister-account-service.js";

export class GrantAdminUseCase {
  constructor(
    private readonly deps: {
      transactionManager: ITransactionManager;
      accountRepository: IAccountRepository;
      registrationRepository: IRegistrationRepository;
    },
  ) {}

  async execute(params: { did: Did }): Promise<void> {
    const registration = await this.deps.registrationRepository.find(
      params.did,
    );
    const account = await this.deps.accountRepository.find(params.did);
    if (!registration || !account) {
      throw new NotMemberError("Not a member of this server");
    }

    account.promoteToAdmin();
    await this.deps.transactionManager.transaction((ctx) =>
      this.deps.accountRepository.save({ ctx, account }),
    );
  }
}
