import type { Did } from "@atproto/did";
import type { Subscription } from "@repo/common/domain";

export interface ISubscriptionQuery {
  findMany: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<Subscription[]>;
  count: () => Promise<number>;
  findTrackedActors: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<{ did: Did; subscriberFollowersCount: number }[]>;
  countTrackedActors: () => Promise<number>;
}
