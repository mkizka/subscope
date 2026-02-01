import type { DatabaseClient } from "@repo/common/domain";
import { InviteCode } from "@repo/common/domain";

import type { IInviteCodeRepository } from "@/server/features/xrpc/application/interfaces/invite-code-repository.js";

export class CreateInviteCodeUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly inviteCodeRepository: IInviteCodeRepository,
    private readonly publicUrl: string,
  ) {}
  static inject = ["db", "inviteCodeRepository", "publicUrl"] as const;

  async execute(params: {
    daysToExpire: number;
  }): Promise<{ code: string; expiresAt: string }> {
    const inviteCode = InviteCode.generate(this.publicUrl, params.daysToExpire);

    await this.inviteCodeRepository.upsert({
      inviteCode,
      ctx: { db: this.db },
    });

    return {
      code: inviteCode.code,
      expiresAt: inviteCode.expiresAt.toISOString(),
    };
  }
}
