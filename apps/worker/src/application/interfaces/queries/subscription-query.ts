import type { TransactionContext } from "@repo/common/domain";

export interface ISubscriptionQuery {
  isSubscriber: (ctx: TransactionContext, actorDid: string) => Promise<boolean>;
  isFollowedByAnySubscriber: (
    ctx: TransactionContext,
    subjectDid: string,
  ) => Promise<boolean>;
}
