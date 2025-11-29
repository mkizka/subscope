import type { Did } from "@atproto/did";
import type { Actor, TransactionContext } from "@repo/common/domain";

import type { IActorRepository } from "../../application/interfaces/actor-repository.js";

export class InMemoryActorRepository implements IActorRepository {
  private actors: Map<Did, Actor> = new Map();

  add(actor: Actor): void {
    this.actors.set(actor.did, actor);
  }

  clear(): void {
    this.actors.clear();
  }

  async findByDid(did: Did): Promise<Actor | null> {
    return this.actors.get(did) ?? null;
  }

  async upsert(params: {
    ctx: TransactionContext;
    actor: Actor;
  }): Promise<void> {
    this.actors.set(params.actor.did, params.actor);
  }
}
