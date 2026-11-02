import type { TransactionContext } from "@repo/common/domain";

export interface PostStats {
  postUri: string;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  quoteCount: number;
}

export interface IPostStatsRepository {
  save: (params: {
    ctx: TransactionContext;
    stats: PostStats[];
  }) => Promise<void>;
}
