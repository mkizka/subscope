import { type Did, isDid } from "@atproto/did";
import {
  DidResolutionError,
  type IDidResolver,
  type IHandleResolver,
  type ITransactionManager,
} from "@repo/common/interface";
import { isHandle } from "@repo/common/utils";

import { Account } from "../../../domain/models/account.js";
import type { IAccountRepository } from "../../interfaces/account-repository.js";
import type { CreateRegistrationService } from "../../service/sync/create-registration-service.js";
import type { ValidateRegistrationService } from "../../service/sync/validate-registration-service.js";

export class AccountNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountNotFound";
  }
}

export class AddMemberUseCase {
  constructor(
    private readonly deps: {
      atprotoHandleResolver: IHandleResolver;
      didResolver: IDidResolver;
      transactionManager: ITransactionManager;
      accountRepository: IAccountRepository;
      validateRegistrationService: ValidateRegistrationService;
      createRegistrationService: CreateRegistrationService;
    },
  ) {}

  private async resolveDid(actor: string): Promise<Did> {
    const did =
      isHandle(actor) && !isDid(actor)
        ? await this.deps.atprotoHandleResolver.resolve(actor)
        : actor;
    if (!isDid(did)) {
      throw new AccountNotFoundError(`Account not found: ${actor}`);
    }
    try {
      await this.deps.didResolver.resolve(did);
    } catch (error) {
      if (error instanceof DidResolutionError) {
        throw new AccountNotFoundError(`Account not found: ${actor}`);
      }
      throw error;
    }
    return did;
  }

  async execute({ actor }: { actor: string }): Promise<void> {
    const accountDid = await this.resolveDid(actor);
    const existingAccount =
      await this.deps.validateRegistrationService.validate(accountDid);

    await this.deps.transactionManager.transaction(async (ctx) => {
      if (!existingAccount) {
        const account = Account.create({ did: accountDid });
        await this.deps.accountRepository.save({ ctx, account });
      }
      await this.deps.createRegistrationService.create({ ctx, accountDid });
    });
  }
}
