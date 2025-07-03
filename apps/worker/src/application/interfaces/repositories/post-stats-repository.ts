import type { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";

export interface IPostStatsRepository {
  upsertLikeCount: (params: {
    ctx: TransactionContext;
    uri: AtUri;
  }) => Promise<void>;

  upsertRepostCount: (params: {
    ctx: TransactionContext;
    uri: AtUri;
  }) => Promise<void>;

  upsertReplyCount: (params: {
    ctx: TransactionContext;
    uri: AtUri;
  }) => Promise<void>;

  upsertAllCount: (params: {
    ctx: TransactionContext;
    uri: AtUri;
  }) => Promise<void>;
}
