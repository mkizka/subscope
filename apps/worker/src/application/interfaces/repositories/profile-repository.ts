import type { Profile, TransactionContext } from "@repo/common/domain";

export interface IProfileRepository {
  save: (params: {
    ctx: TransactionContext;
    profile: Profile;
  }) => Promise<void>;
}
