import type { Did } from "@atproto/did";
import type { Profile, TransactionContext } from "@dawn/common/domain";

export interface IProfileRepository {
  exists: (params: { ctx: TransactionContext; did: Did }) => Promise<boolean>;
  upsert: (params: {
    ctx: TransactionContext;
    profile: Profile;
  }) => Promise<void>;
}
