import { InvalidRequestError } from "@atproto/xrpc-server";
import type { DatabaseClient } from "@repo/common/domain";

import type { IInviteCodeRepository } from "@/server/features/xrpc/application/interfaces/invite-code-repository.js";

export class DeleteInviteCodeUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly inviteCodeRepository: IInviteCodeRepository,
  ) {}
  static inject = ["db", "inviteCodeRepository"] as const;

  async execute(params: { code: string }): Promise<void> {
    const inviteCode = await this.inviteCodeRepository.findFirst(params.code);

    if (!inviteCode) {
      throw new InvalidRequestError(
        "Invite code not found",
        "InviteCodeNotFound",
      );
    }

    if (inviteCode.isUsed()) {
      throw new InvalidRequestError(
        "Invite code already used",
        "InviteCodeAlreadyUsed",
      );
    }

    await this.inviteCodeRepository.delete({
      code: params.code,
      ctx: { db: this.db },
    });
  }
}
