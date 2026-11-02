import type { Did } from "@atproto/did";
import type { Subscription, TransactionContext } from "@repo/common/domain";

export interface ISubscriptionRepository {
  findMany: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<Subscription[]>;
  count: () => Promise<number>;
  find: (actorDid: Did) => Promise<Subscription | null>;
  findTrackedActors: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<{ did: Did; subscriberFollowersCount: number }[]>;
  countTrackedActors: () => Promise<number>;
  save: (params: {
    subscription: Subscription;
    ctx: TransactionContext;
  }) => Promise<void>;
  delete: (actorDid: Did) => Promise<void>;
}
