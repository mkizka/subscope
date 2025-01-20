import type { Actor, TransactionContext } from "@dawn/common/domain";

export interface IActorRepository {
  findOne: (params: {
    ctx: TransactionContext;
    did: string;
  }) => Promise<Actor | null>;

  createOrUpdate: (params: {
    ctx: TransactionContext;
    actor: Actor;
  }) => Promise<void>;
}
