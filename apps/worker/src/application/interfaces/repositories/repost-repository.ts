import type { Repost, TransactionContext } from "@repo/common/domain";

export interface IRepostRepository {
  save: (params: { ctx: TransactionContext; repost: Repost }) => Promise<void>;
}
