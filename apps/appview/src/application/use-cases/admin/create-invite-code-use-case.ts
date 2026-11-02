import { type DatetimeString, toDatetimeString } from "@atproto/syntax";
import { InviteCode, type ITransactionManager } from "@repo/common/domain";

import type { IInviteCodeRepository } from "../../../application/interfaces/invite-code-repository.js";

export class CreateInviteCodeUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly inviteCodeRepository: IInviteCodeRepository,
    private readonly publicUrl: string,
  ) {}

  async execute(params: {
    daysToExpire: number;
  }): Promise<{ code: string; expiresAt: DatetimeString }> {
    const inviteCode = InviteCode.generate(this.publicUrl, params.daysToExpire);

    await this.transactionManager.transaction((ctx) =>
      this.inviteCodeRepository.save({ inviteCode, ctx }),
    );

    return {
      code: inviteCode.code,
      expiresAt: toDatetimeString(inviteCode.expiresAt),
    };
  }
}
