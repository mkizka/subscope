import type { Did } from "@atproto/did";
import type { ITransactionManager } from "@repo/common/domain";

import type { IAccountRepository } from "../../../application/interfaces/account-repository.js";
import type { IRegistrationRepository } from "../../../application/interfaces/registration-repository.js";
import { NotRegisteredError } from "../../../application/use-cases/sync/unregister-account-use-case.js";

export class GrantAdminUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly accountRepository: IAccountRepository,
    private readonly registrationRepository: IRegistrationRepository,
  ) {}

  async execute(params: { did: Did }): Promise<void> {
    const registration = await this.registrationRepository.find(params.did);
    const account = await this.accountRepository.find(params.did);
    if (!registration || !account) {
      throw new NotRegisteredError("Not registered with this server");
    }

    account.promoteToAdmin();
    await this.transactionManager.transaction((ctx) =>
      this.accountRepository.save({ ctx, account }),
    );
  }
}
