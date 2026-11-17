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
    private readonly atprotoHandleResolver: IHandleResolver,
    private readonly didResolver: IDidResolver,
    private readonly transactionManager: ITransactionManager,
    private readonly accountRepository: IAccountRepository,
    private readonly validateRegistrationService: ValidateRegistrationService,
    private readonly createRegistrationService: CreateRegistrationService,
  ) {}

  private async resolveDid(actor: string): Promise<Did> {
    const did =
      isHandle(actor) && !isDid(actor)
        ? await this.atprotoHandleResolver.resolve(actor)
        : actor;
    if (!isDid(did)) {
      throw new AccountNotFoundError(`Account not found: ${actor}`);
    }
    try {
      await this.didResolver.resolve(did);
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
      await this.validateRegistrationService.validate(accountDid);

    await this.transactionManager.transaction(async (ctx) => {
      if (!existingAccount) {
        const account = Account.create({ did: accountDid });
        await this.accountRepository.save({ ctx, account });
      }
      await this.createRegistrationService.create({ ctx, accountDid });
    });
  }
}
