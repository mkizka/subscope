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
    private readonly transactionManager: ITransactionManager,
    private readonly accountRepository: IAccountRepository,
    private readonly inviteCodeRepository: IInviteCodeRepository,
    private readonly validateRegistrationService: ValidateRegistrationService,
    private readonly createRegistrationService: CreateRegistrationService,
  ) {}

  private async useInviteCode(
    code: string | undefined,
    ctx: TransactionContext,
  ): Promise<void> {
    if (!code) {
      throw new InvalidInviteCodeError("Invite code is required");
    }

    const inviteCode = await this.inviteCodeRepository.find({ code, ctx });

    if (!inviteCode) {
      throw new InvalidInviteCodeError("Invalid invite code");
    }
    if (!inviteCode.canBeUsed()) {
      throw new InvalidInviteCodeError(
        "Invite code has expired or already been used",
      );
    }
    inviteCode.markAsUsed();
    await this.inviteCodeRepository.save({ inviteCode, ctx });
  }

  async execute({
    accountDid,
    code,
  }: {
    accountDid: Did;
    code?: string;
  }): Promise<void> {
    const existingAccount =
      await this.validateRegistrationService.validate(accountDid);

    await this.transactionManager.transaction(async (ctx) => {
      if (!existingAccount?.isAdmin) {
        await this.useInviteCode(code, ctx);
      }
      if (!existingAccount) {
        const account = Account.create({ did: accountDid });
        await this.accountRepository.save({ ctx, account });
      }
      await this.createRegistrationService.create({
        ctx,
        accountDid,
        inviteCode: code,
      });
    });
  }
}
