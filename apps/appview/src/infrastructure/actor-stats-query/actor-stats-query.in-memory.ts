import type { Did } from "@atproto/did";

import type { ActorStatsDto } from "../../application/dto/actor-stats-dto.js";
import type { IActorStatsQuery } from "../../application/interfaces/actor-stats-query.js";

export class InMemoryActorStatsQuery implements IActorStatsQuery {
  private stats: Map<string, ActorStatsDto> = new Map();

  add(actorDid: Did, stats: Omit<ActorStatsDto, "actorDid">): void {
    this.stats.set(actorDid, { actorDid, ...stats });
  }

  clear(): void {
    this.stats.clear();
  }

  findStats(actorDids: Did[]): Promise<ActorStatsDto[]> {
    return Promise.resolve(
      actorDids.flatMap((actorDid) => this.stats.get(actorDid) ?? []),
    );
  }
}
