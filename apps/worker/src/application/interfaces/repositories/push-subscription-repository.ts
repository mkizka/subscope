import type { TransactionContext } from "@repo/common/interface";

export interface IPushSubscriptionRepository {
  delete: (params: {
    ctx: TransactionContext;
    endpoint: string;
  }) => Promise<void>;
}
