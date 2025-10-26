import type { Did } from "@atproto/did";
import type { Actor, TransactionContext } from "@repo/common/domain";

export interface IActorRepository {
  upsert: (params: { ctx: TransactionContext; actor: Actor }) => Promise<void>;

  findByDid: (params: {
    ctx: TransactionContext;
    did: Did;
  }) => Promise<Actor | null>;

  exists: (params: { ctx: TransactionContext; did: Did }) => Promise<boolean>;

  delete: (params: { ctx: TransactionContext; did: Did }) => Promise<void>;
}
