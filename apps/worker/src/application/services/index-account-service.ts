import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";
import type { Handle } from "@repo/common/utils";

import type { AccountStatus } from "../../domain/account.js";
import { Account } from "../../domain/account.js";
import type { IAccountRepository } from "../interfaces/repositories/account-repository.js";

export class IndexAccountService {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async upsert({
    ctx,
    did,
    handle,
    status,
  }: {
    ctx: TransactionContext;
    did: Did;
    handle?: Handle;
    status?: AccountStatus;
  }): Promise<void> {
    const existingAccount = await this.accountRepository.find({ ctx, did });
    const account = existingAccount ?? Account.create({ did });
    const changed = account.update({ handle, status });

    if (!existingAccount || changed) {
      await this.accountRepository.save({ ctx, account });
    }
  }

  async delete({
    ctx,
    did,
  }: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<void> {
    await this.accountRepository.delete({ ctx, did });
  }
}
