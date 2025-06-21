import type { Post, TransactionContext } from "@repo/common/domain";

export interface IPostRepository {
  upsert: (params: { ctx: TransactionContext; post: Post }) => Promise<void>;
  exists: (ctx: TransactionContext, uri: string) => Promise<boolean>;
  existsAny: (ctx: TransactionContext, uris: string[]) => Promise<boolean>;
}
