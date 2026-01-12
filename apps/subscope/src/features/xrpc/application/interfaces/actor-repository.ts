import type { Did } from "@atproto/did";
import type { Actor, TransactionContext } from "@repo/common/domain";

export interface IActorRepository {
  findByDid: (did: Did) => Promise<Actor | null>;
  upsert: (params: { ctx: TransactionContext; actor: Actor }) => Promise<void>;
}
