import type { Did } from "@atproto/did";
import {
  Account,
  type IJobScheduler,
  type ITransactionManager,
  Registration,
  type TransactionContext,
} from "@repo/common/domain";

import type { IAccountRepository } from "../../../application/interfaces/account-repository.js";
import type { IInviteCodeRepository } from "../../../application/interfaces/invite-code-repository.js";
import type { IRegistrationRepository } from "../../../application/interfaces/registration-repository.js";

export class InvalidInviteCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInviteCode";
  }
}

export class AlreadyRegisteredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlreadyRegistered";
  }
}

export class BannedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Banned";
  }
}

type RegisterAccountParams = {
  accountDid: Did;
  code?: string;
};

export class RegisterAccountUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly accountRepository: IAccountRepository,
    private readonly inviteCodeRepository: IInviteCodeRepository,
    private readonly registrationRepository: IRegistrationRepository,
    private readonly jobScheduler: IJobScheduler,
  ) {}

  private async useInviteCode(
    code: string | undefined,
    ctx: TransactionContext,
  ): Promise<void> {
    if (!code) {
      // 将来的には設定から招待コード不要にも出来るようにする
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

  async execute({ accountDid, code }: RegisterAccountParams): Promise<void> {
    const existingRegistration =
      await this.registrationRepository.find(accountDid);
    if (existingRegistration) {
      throw new AlreadyRegisteredError("Already registered with this server");
    }

    const existingAccount = await this.accountRepository.find(accountDid);
    if (existingAccount?.isBanned) {
      throw new BannedError("Banned from this server");
    }

    await this.transactionManager.transaction(async (ctx) => {
      if (!existingAccount?.isAdmin) {
        await this.useInviteCode(code, ctx);
      }

      if (!existingAccount) {
        const account = Account.create({
          did: accountDid,
        });
        await this.accountRepository.save({ ctx, account });
      }

      const registration = new Registration({
        accountDid,
        inviteCode: code,
        createdAt: new Date(),
      });
      await this.registrationRepository.save({ ctx, registration });
    });

    await this.jobScheduler.scheduleSyncTapRepo(accountDid);
  }
}
