import type { Repost, TransactionContext } from "@repo/common/domain";

export interface IRepostRepository {
  upsert: (params: {
    ctx: TransactionContext;
    repost: Repost;
  }) => Promise<void>;
}
