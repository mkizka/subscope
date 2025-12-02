import type { Did } from "@atproto/did";
import type { Actor, TransactionContext } from "@repo/common/domain";

import type { IActorRepository } from "../../../application/interfaces/repositories/actor-repository.js";

export class InMemoryActorRepository implements IActorRepository {
  private actors: Map<Did, Actor> = new Map();

  add(actor: Actor): void {
    this.actors.set(actor.did, actor);
  }

  clear(): void {
    this.actors.clear();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async upsert(params: {
    ctx: TransactionContext;
    actor: Actor;
  }): Promise<void> {
    this.actors.set(params.actor.did, params.actor);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async findByDid(params: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<Actor | null> {
    return this.actors.get(params.did) ?? null;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async exists(params: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<boolean> {
    return this.actors.has(params.did);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async delete(params: { ctx: TransactionContext; did: Did }): Promise<void> {
    this.actors.delete(params.did);
  }
}
