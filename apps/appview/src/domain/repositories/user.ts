import type { User } from "../models/user.js";
import type { TransactionContext } from "./transaction-manager.js";

export interface IUserRepository {
  findOne: (params: {
    ctx?: TransactionContext;
    did: string;
  }) => Promise<User | null>;

  createOrUpdate: (params: {
    ctx?: TransactionContext;
    user: User;
  }) => Promise<void>;
}
