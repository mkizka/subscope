import type { Profile } from "../models/profile.js";
import type { TransactionContext } from "./transaction.js";

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
