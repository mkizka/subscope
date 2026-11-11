import type { Did } from "@atproto/did";
import { DidNotFoundError, type IDidResolver } from "@repo/common/interface";
import { type ITransactionManager } from "@repo/common/interface";

import { Account } from "../../../domain/account.js";
import type { IHandleResolver } from "../../interfaces/external/handle-resolver.js";
import type { IAccountRepository } from "../../interfaces/repositories/account-repository.js";

export class ResolveDidUseCase {
  constructor(
    private readonly didResolver: IDidResolver,
    private readonly handleResolver: IHandleResolver,
    private readonly accountRepository: IAccountRepository,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(did: Did) {
    const existingAccount = await this.transactionManager.transaction((ctx) =>
      this.accountRepository.find({ ctx, did }),
    );
    if (
      existingAccount?.handle &&
      existingAccount.handle !== "handle.invalid"
    ) {
      return;
    }

    let handle;
    try {
      ({ handle } = await this.didResolver.resolve(did));
    } catch (error) {
      if (error instanceof DidNotFoundError) return;
      throw error;
    }
    const resolvedDid = await this.handleResolver.resolve(handle);

    const account = existingAccount ?? Account.create({ did });
    account.updateHandle(resolvedDid === did ? handle : "handle.invalid");

    await this.transactionManager.transaction((ctx) =>
      this.accountRepository.save({ ctx, account }),
    );
  }
}
