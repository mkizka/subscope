import type { Did } from "@atproto/did";
import {
  type ITransactionManager,
  type TransactionContext,
} from "@repo/common/interface";

import { Account } from "../../../domain/models/account.js";
import type { IAccountRepository } from "../../interfaces/account-repository.js";
import type { IInviteCodeRepository } from "../../interfaces/invite-code-repository.js";
import type { CreateRegistrationService } from "../../service/sync/create-registration-service.js";
import type { ValidateRegistrationService } from "../../service/sync/validate-registration-service.js";

export class InvalidInviteCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInviteCode";
  }
}

export class RegisterAccountUseCase {
  constructor(
    private readonly deps: {
      transactionManager: ITransactionManager;
      accountRepository: IAccountRepository;
      inviteCodeRepository: IInviteCodeRepository;
      validateRegistrationService: ValidateRegistrationService;
      createRegistrationService: CreateRegistrationService;
    },
  ) {}

  private async useInviteCode(
    code: string | undefined,
    ctx: TransactionContext,
  ): Promise<void> {
    if (!code) {
      throw new InvalidInviteCodeError("Invite code is required");
    }

    const inviteCode = await this.deps.inviteCodeRepository.find({ code, ctx });

    if (!inviteCode) {
      throw new InvalidInviteCodeError("Invalid invite code");
    }
    if (!inviteCode.canBeUsed()) {
      throw new InvalidInviteCodeError(
        "Invite code has expired or already been used",
      );
    }
    inviteCode.markAsUsed();
    await this.deps.inviteCodeRepository.save({ inviteCode, ctx });
  }

  async execute({
    accountDid,
    code,
  }: {
    accountDid: Did;
    code?: string;
  }): Promise<void> {
    const existingAccount =
      await this.deps.validateRegistrationService.validate(accountDid);

    await this.deps.transactionManager.transaction(async (ctx) => {
      if (!existingAccount?.isAdmin) {
        await this.useInviteCode(code, ctx);
      }
      if (!existingAccount) {
        const account = Account.create({ did: accountDid });
        await this.deps.accountRepository.save({ ctx, account });
      }
      await this.deps.createRegistrationService.create({
        ctx,
        accountDid,
        inviteCode: code,
      });
    });
  }
}
