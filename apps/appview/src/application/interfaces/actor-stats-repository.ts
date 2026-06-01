export interface ActorStats {
  followsCount: number;
  followersCount: number;
  postsCount: number;
}

export interface IActorStatsRepository {
  findStats: (actorDids: string[]) => Promise<Map<string, ActorStats>>;
}
