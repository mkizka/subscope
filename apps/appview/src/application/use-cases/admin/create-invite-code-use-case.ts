import { InviteCode } from "@repo/common/domain";

import type { IInviteCodeRepository } from "../../interfaces/invite-code-repository.js";

export class CreateInviteCodeUseCase {
  constructor(
    private readonly inviteCodeRepository: IInviteCodeRepository,
    private readonly publicUrl: string,
  ) {}
  static inject = ["inviteCodeRepository", "publicUrl"] as const;

  async execute(params: {
    daysToExpire: number;
  }): Promise<{ code: string; expiresAt: string }> {
    const inviteCode = InviteCode.generate(this.publicUrl, params.daysToExpire);

    await this.inviteCodeRepository.save(inviteCode);

    return {
      code: inviteCode.code,
      expiresAt: inviteCode.expiresAt.toISOString(),
    };
  }
}
