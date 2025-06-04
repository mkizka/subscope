import type { Did } from "@atproto/did";
import type { Actor, TransactionContext } from "@dawn/common/domain";

export interface IActorRepository {
  upsert: (params: { ctx: TransactionContext; actor: Actor }) => Promise<void>;

  findByDid: (params: {
    ctx: TransactionContext;
    did: Did;
  }) => Promise<Actor | null>;
}
