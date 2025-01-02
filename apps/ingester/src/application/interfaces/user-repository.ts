import type { TransactionContext, User } from "@dawn/common/domain";

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
