import type {
  ActorStats,
  IActorStatsRepository,
} from "../../application/interfaces/actor-stats-repository.js";

export class InMemoryActorStatsRepository implements IActorStatsRepository {
  private stats: Map<string, ActorStats> = new Map();

  set(actorDid: string, stats: ActorStats): void {
    this.stats.set(actorDid, stats);
  }

  setAll(entries: Array<[string, ActorStats]>): void {
    entries.forEach(([actorDid, stats]) => this.stats.set(actorDid, stats));
  }

  clear(): void {
    this.stats.clear();
  }

  findStats(actorDids: string[]): Promise<Map<string, ActorStats>> {
    const result = new Map<string, ActorStats>();

    for (const actorDid of actorDids) {
      const stat = this.stats.get(actorDid);
      if (stat) {
        result.set(actorDid, stat);
      }
    }

    return Promise.resolve(result);
  }
}
