import type { TransactionContext } from "@repo/common/domain";

export interface IActorStatsRepository {
  upsertFollowsCount: (params: {
    ctx: TransactionContext;
    actorDid: string;
  }) => Promise<void>;

  upsertFollowersCount: (params: {
    ctx: TransactionContext;
    actorDid: string;
  }) => Promise<void>;

  upsertPostsCount: (params: {
    ctx: TransactionContext;
    actorDid: string;
  }) => Promise<void>;
}
