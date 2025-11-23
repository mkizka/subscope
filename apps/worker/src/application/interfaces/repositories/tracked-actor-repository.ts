import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";

export interface ITrackedActorRepository {
  isTrackedActor: (ctx: TransactionContext, actorDid: Did) => Promise<boolean>;
  hasTrackedActor: (
    ctx: TransactionContext,
    actorDids: Did[],
  ) => Promise<boolean>;
}
