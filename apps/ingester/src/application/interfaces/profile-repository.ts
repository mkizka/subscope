import type { Profile, TransactionContext } from "@dawn/common/domain";

export interface IProfileRepository {
  createOrUpdate: (params: {
    ctx?: TransactionContext;
    profile: Profile;
  }) => Promise<void>;
}
