import { type DatetimeString, toDatetimeString } from "@atproto/syntax";
import { type ITransactionManager } from "@repo/common/interface";

import type { IInviteCodeRepository } from "../../../application/interfaces/invite-code-repository.js";
import { InviteCode } from "../../../domain/models/invite-code.js";
import type { Env } from "../../../shared/env.js";

export class CreateInviteCodeUseCase {
  constructor(
    private readonly transactionManager: ITransactionManager,
    private readonly inviteCodeRepository: IInviteCodeRepository,
    private readonly env: Pick<Env, "PUBLIC_URL">,
  ) {}

  async execute(params: {
    daysToExpire: number;
  }): Promise<{ code: string; expiresAt: DatetimeString }> {
    const inviteCode = InviteCode.generate(
      this.env.PUBLIC_URL,
      params.daysToExpire,
    );

    await this.transactionManager.transaction((ctx) =>
      this.inviteCodeRepository.save({ inviteCode, ctx }),
    );

    return {
      code: inviteCode.code,
      expiresAt: toDatetimeString(inviteCode.expiresAt),
    };
  }
}
