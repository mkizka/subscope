import type { Did } from "@atproto/did";
import type { Subscription, TransactionContext } from "@repo/common/domain";

export interface ISubscriptionRepository {
  find: (actorDid: Did) => Promise<Subscription | null>;
  save: (params: {
    subscription: Subscription;
    ctx: TransactionContext;
  }) => Promise<void>;
  delete: (actorDid: Did) => Promise<void>;
}
