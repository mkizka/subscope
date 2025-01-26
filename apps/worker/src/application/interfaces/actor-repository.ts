import type { Actor, TransactionContext } from "@dawn/common/domain";

export interface IActorRepository {
  exists: (params: {
    ctx: TransactionContext;
    did: string;
  }) => Promise<boolean>;

  createOrUpdate: (params: {
    ctx: TransactionContext;
    actor: Actor;
  }) => Promise<void>;
}
