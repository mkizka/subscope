export interface PostStats {
  likeCount: number;
  repostCount: number;
  replyCount: number;
  quoteCount: number;
}

export interface IPostStatsRepository {
  findByUris: (postUris: string[]) => Promise<Map<string, PostStats>>;
}
