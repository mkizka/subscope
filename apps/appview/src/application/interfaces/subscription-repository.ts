import type { Subscription } from "@repo/common/domain";

export interface ISubscriptionRepository {
  findMany: (params: {
    limit: number;
    cursor?: string;
  }) => Promise<Subscription[]>;
}
