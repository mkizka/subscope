import type { Profile } from "../models/profile.js";
import type { ProfileDetailed } from "../models/profile-detailed.js";
import type { TransactionContext } from "./transaction.js";

export interface IProfileRepository {
  findOne: (params: {
    ctx?: TransactionContext;
    did: string;
  }) => Promise<ProfileDetailed | null>;

  createOrUpdate: (params: {
    ctx?: TransactionContext;
    profile: Profile;
  }) => Promise<void>;
}
