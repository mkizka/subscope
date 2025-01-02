import type { Profile, TransactionContext } from "@dawn/common/domain";

export interface IProfileRepository {
  findOne: (params: {
    ctx?: TransactionContext;
    did: string;
  }) => Promise<Profile | null>;

  createOrUpdate: (params: {
    ctx?: TransactionContext;
    profile: Profile;
  }) => Promise<void>;
}
