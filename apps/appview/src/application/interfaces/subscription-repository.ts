import type { Did } from "@atproto/did";
import type { Subscription, TransactionContext } from "@repo/common/domain";

export interface ISubscriptionRepository {
  findMany: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<Subscription[]>;
  findFirst: (actorDid: Did) => Promise<Subscription | null>;
  findTrackedActors: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<{ did: Did; subscriberFollowersCount: number }[]>;
  existsByInviteCode: (inviteCode: string) => Promise<boolean>;
  save: (params: {
    subscription: Subscription;
    ctx: TransactionContext;
  }) => Promise<void>;
  updateSeenAt: (actorDid: Did, seenAt: Date) => Promise<void>;
  delete: (actorDid: Did) => Promise<void>;
}
