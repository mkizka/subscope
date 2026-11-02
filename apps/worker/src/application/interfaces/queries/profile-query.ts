import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";

export interface IProfileQuery {
  exists: (params: {
    ctx: TransactionContext;
    actorDid: Did;
  }) => Promise<boolean>;
}
