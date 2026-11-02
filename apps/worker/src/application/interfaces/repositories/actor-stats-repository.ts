import type { TransactionContext } from "@repo/common/domain";

export interface ActorStats {
  actorDid: string;
  followsCount: number;
  followersCount: number;
  postsCount: number;
}

export interface IActorStatsRepository {
  save: (params: {
    ctx: TransactionContext;
    stats: ActorStats;
  }) => Promise<void>;
}
