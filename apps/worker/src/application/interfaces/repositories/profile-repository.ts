import type { Profile, TransactionContext } from "@repo/common/domain";

export interface IProfileRepository {
  upsert: (params: {
    ctx: TransactionContext;
    profile: Profile;
  }) => Promise<void>;
}
