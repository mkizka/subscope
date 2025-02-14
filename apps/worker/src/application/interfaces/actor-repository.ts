import type { Actor, TransactionContext } from "@dawn/common/domain";

export interface IActorRepository {
  create: (params: { ctx: TransactionContext; actor: Actor }) => Promise<void>;

  upsert: (params: { ctx: TransactionContext; actor: Actor }) => Promise<void>;
}
