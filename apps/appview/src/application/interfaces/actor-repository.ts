import type { Did } from "@atproto/did";
import type { Actor, TransactionContext } from "@repo/common/domain";

export interface IActorRepository {
  find: (did: Did) => Promise<Actor | null>;
  save: (params: { ctx: TransactionContext; actor: Actor }) => Promise<void>;
}
