import type { DatabaseClient } from "@repo/common/domain";

import type { IInviteCodeRepository } from "../../../application/interfaces/invite-code-repository.js";

export class InviteCodeNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InviteCodeNotFound";
  }
}

export class InviteCodeAlreadyUsedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InviteCodeAlreadyUsed";
  }
}

export class DeleteInviteCodeUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly inviteCodeRepository: IInviteCodeRepository,
  ) {}
  static inject = ["db", "inviteCodeRepository"] as const;

  async execute(params: { code: string }): Promise<void> {
    const inviteCode = await this.inviteCodeRepository.findFirst(params.code);

    if (!inviteCode) {
      throw new InviteCodeNotFoundError("Invite code not found");
    }

    if (inviteCode.isUsed()) {
      throw new InviteCodeAlreadyUsedError("Invite code already used");
    }

    await this.inviteCodeRepository.delete({
      code: params.code,
      ctx: { db: this.db },
    });
  }
}
