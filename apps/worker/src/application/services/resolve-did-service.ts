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
    private readonly deps: {
      didResolver: IDidResolver;
      handleResolver: IHandleResolver;
      accountRepository: IAccountRepository;
      transactionManager: ITransactionManager;
    },
  ) {}

  async resolve(did: Did) {
    const existingAccount = await this.deps.transactionManager.transaction(
      (ctx) => this.deps.accountRepository.find({ ctx, did }),
    );
    if (existingAccount && !existingAccount.needsHandleResolution) {
      return;
    }

    let handle;
    try {
      ({ handle } = await this.deps.didResolver.resolve(did));
    } catch (error) {
      if (error instanceof DidNotFoundError) return;
      throw error;
    }
    const resolvedDid = await this.deps.handleResolver.resolve(handle);

    const account = existingAccount ?? Account.create({ did });
    account.applyResolvedHandle({ handle, resolvedDid });

    await this.deps.transactionManager.transaction((ctx) =>
      this.deps.accountRepository.save({ ctx, account }),
    );
  }
}
