import type { AtUri } from "@atproto/syntax";

export interface PostStats {
  likeCount: number;
  repostCount: number;
  replyCount: number;
  quoteCount: number;
}

export interface IPostStatsRepository {
  findMap: (uris: AtUri[]) => Promise<Map<string, PostStats>>;
}
