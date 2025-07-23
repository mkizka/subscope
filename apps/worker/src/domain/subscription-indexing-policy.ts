import type { TransactionContext } from "@repo/common/domain";
import type { Subscription } from "@repo/common/domain";

import type { IInviteCodeRepository } from "../application/interfaces/repositories/invite-code-repository.js";
import { env } from "../shared/env.js";

export class SubscriptionIndexingPolicy {
  constructor(private inviteCodeRepository: IInviteCodeRepository) {}
  static inject = ["inviteCodeRepository"] as const;

  async shouldIndex(
    ctx: TransactionContext,
    subscription: Subscription,
  ): Promise<boolean> {
    if (
      subscription.appviewDid !== env.APPVIEW_DID ||
      !subscription.inviteCode
    ) {
      return false;
    }

    const inviteCode = await this.inviteCodeRepository.findByCode(
      ctx,
      subscription.inviteCode,
    );

    return inviteCode !== null && !inviteCode.isExpired();
  }
}
