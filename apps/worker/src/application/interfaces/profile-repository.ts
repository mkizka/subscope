import type { Profile, TransactionContext } from "@dawn/common/domain";

export interface IProfileRepository {
  upsert: (params: {
    ctx: TransactionContext;
    profile: Profile;
  }) => Promise<void>;
}
