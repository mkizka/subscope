import type { Did } from "@atproto/did";
import type { Profile, TransactionContext } from "@repo/common/domain";

export interface IProfileRepository {
  upsert: (params: {
    ctx: TransactionContext;
    profile: Profile;
  }) => Promise<void>;
  exists: (params: {
    ctx: TransactionContext;
    actorDid: Did;
  }) => Promise<boolean>;
}
