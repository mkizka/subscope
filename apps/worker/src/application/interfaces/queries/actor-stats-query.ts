import type { TransactionContext } from "@repo/common/domain";

import type { ActorStats } from "../repositories/actor-stats-repository.js";

export interface IActorStatsQuery {
  countStats: (params: {
    ctx: TransactionContext;
    actorDid: string;
  }) => Promise<ActorStats>;
}
