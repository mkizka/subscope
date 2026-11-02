import type { Did } from "@atproto/did";
import type { Actor } from "@repo/common/domain";

import type { IActorQuery } from "../../application/interfaces/actor-query.js";

export class InMemoryActorQuery implements IActorQuery {
  private actors: Map<Did, Actor> = new Map();

  add(actor: Actor): void {
    this.actors.set(actor.did, actor);
  }

  clear(): void {
    this.actors.clear();
  }

  hasAnyAdmin(): Promise<boolean> {
    return Promise.resolve(
      [...this.actors.values()].some((actor) => actor.isAdmin),
    );
  }

  findBannedDids(params: { limit: number; cursor?: string }): Promise<Did[]> {
    const dids = [...this.actors.values()]
      .filter((actor) => actor.isBanned)
      .map((actor) => actor.did)
      .filter((did) => !params.cursor || did > params.cursor)
      .sort()
      .slice(0, params.limit);
    return Promise.resolve(dids);
  }
}
