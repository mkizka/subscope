import type { TransactionContext } from "@repo/common/domain";

import type { Profile } from "../../dto/profile.js";

export interface IProfileRepository {
  save: (params: {
    ctx: TransactionContext;
    profile: Profile;
  }) => Promise<void>;
}
