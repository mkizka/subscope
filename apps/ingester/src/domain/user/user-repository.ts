import type { TransactionContext } from "../../application/interfaces/transaction.js";
import type { User } from "./user.js";

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
