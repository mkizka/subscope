import type { Did } from "@atproto/did";
import type { Subscription, TransactionContext } from "@repo/common/domain";

export interface ISubscriptionRepository {
  findMany: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<Subscription[]>;
  findFirst: (actorDid: Did) => Promise<Subscription | null>;
  existsByInviteCode: (inviteCode: string) => Promise<boolean>;
  save: (params: {
    subscription: Subscription;
    ctx: TransactionContext;
  }) => Promise<void>;
  delete: (actorDid: Did) => Promise<void>;
}
