import { type DatetimeString, toDatetimeString } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { InviteCode } from "@repo/common/domain";

import type { IInviteCodeRepository } from "../../../application/interfaces/invite-code-repository.js";

export class CreateInviteCodeUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly inviteCodeRepository: IInviteCodeRepository,
    private readonly publicUrl: string,
  ) {}

  async execute(params: {
    daysToExpire: number;
  }): Promise<{ code: string; expiresAt: DatetimeString }> {
    const inviteCode = InviteCode.generate(this.publicUrl, params.daysToExpire);

    await this.inviteCodeRepository.upsert({
      inviteCode,
      ctx: { db: this.db },
    });

    return {
      code: inviteCode.code,
      expiresAt: toDatetimeString(inviteCode.expiresAt),
    };
  }
}
