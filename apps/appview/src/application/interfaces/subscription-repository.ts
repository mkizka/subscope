import type { Did } from "@atproto/did";
import type { Subscription } from "@repo/common/domain";

export interface ISubscriptionRepository {
  findMany: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<Subscription[]>;
  findFirst: (actorDid: Did) => Promise<Subscription | null>;
  existsByInviteCode: (inviteCode: string) => Promise<boolean>;
  save: (subscription: Subscription) => Promise<void>;
  delete: (actorDid: Did) => Promise<void>;
}
