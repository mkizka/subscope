import type { Did } from "@atproto/did";
import type { Actor, TransactionContext } from "@repo/common/domain";
import type { BackfillStatus } from "@repo/common/domain";
import type { Handle } from "@repo/common/utils";

export interface IActorRepository {
  upsert: (params: { ctx: TransactionContext; actor: Actor }) => Promise<void>;

  findByDid: (params: {
    ctx: TransactionContext;
    did: Did;
  }) => Promise<Actor | null>;

  updateBackfillStatus: (params: {
    ctx: TransactionContext;
    did: Did;
    status: BackfillStatus;
  }) => Promise<void>;

  updateHandle: (params: {
    ctx: TransactionContext;
    did: Did;
    handle: Handle;
  }) => Promise<void>;
}
