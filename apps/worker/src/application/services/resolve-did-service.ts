import type { Did } from "@atproto/did";
import {
  DidNotFoundError,
  type IDidResolver,
  type IHandleResolver,
} from "@repo/common/interface";
import { type ITransactionManager } from "@repo/common/interface";

import { Account } from "../../domain/account.js";
import type { IAccountRepository } from "../interfaces/repositories/account-repository.js";

export class ResolveDidService {
  constructor(
    private readonly didResolver: IDidResolver,
    private readonly handleResolver: IHandleResolver,
    private readonly accountRepository: IAccountRepository,
    private readonly transactionManager: ITransactionManager,
  ) {}

  async resolve(did: Did) {
    const existingAccount = await this.transactionManager.transaction((ctx) =>
      this.accountRepository.find({ ctx, did }),
    );
    if (existingAccount && !existingAccount.needsHandleResolution) {
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
    account.applyResolvedHandle({ handle, resolvedDid });

    await this.transactionManager.transaction((ctx) =>
      this.accountRepository.save({ ctx, account }),
    );
  }
}
