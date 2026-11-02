import type { Did } from "@atproto/did";

import type { ActorStatsDto } from "../../dto/actor-stats-dto.js";

export interface IActorStatsQuery {
  findStats: (actorDids: Did[]) => Promise<ActorStatsDto[]>;
}
