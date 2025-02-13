import type { Actor, TransactionContext } from "@dawn/common/domain";

export interface IActorRepository {
  exists: (params: {
    ctx: TransactionContext;
    did: string;
  }) => Promise<boolean>;

  create(params: { ctx: TransactionContext; actor: Actor }): Promise<void>;

  upsert: (params: { ctx: TransactionContext; actor: Actor }) => Promise<void>;
}
