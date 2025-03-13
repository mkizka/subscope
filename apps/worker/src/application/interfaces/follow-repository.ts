import type { Follow, TransactionContext } from "@dawn/common/domain";

export interface IFollowRepository {
  upsert: (params: {
    ctx: TransactionContext;
    follow: Follow;
  }) => Promise<void>;
}
