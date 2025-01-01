import type { TransactionContext } from "../interfaces/transaction.js";
import type { Profile } from "./profile.js";

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
