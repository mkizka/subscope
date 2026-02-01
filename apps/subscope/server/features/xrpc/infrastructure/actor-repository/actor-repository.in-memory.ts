import type { Did } from "@atproto/did";
import type { Actor, TransactionContext } from "@repo/common/domain";

import type { IActorRepository } from "@/server/features/xrpc/application/interfaces/actor-repository.js";

export class InMemoryActorRepository implements IActorRepository {
  private actors: Map<Did, Actor> = new Map();

  add(actor: Actor): void {
    this.actors.set(actor.did, actor);
  }

  clear(): void {
    this.actors.clear();
  }

  findByDid(did: Did): Promise<Actor | null> {
    return Promise.resolve(this.actors.get(did) ?? null);
  }

  upsert(params: { ctx: TransactionContext; actor: Actor }): Promise<void> {
    this.actors.set(params.actor.did, params.actor);
    return Promise.resolve();
  }

  hasAnyAdmin(): Promise<boolean> {
    for (const actor of this.actors.values()) {
      if (actor.isAdmin) {
        return Promise.resolve(true);
      }
    }
    return Promise.resolve(false);
  }
}
