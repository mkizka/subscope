import type { Did } from "@atproto/did";
import type { Account, TransactionContext } from "@repo/common/domain";

export interface IAccountRepository {
  save: (params: {
    ctx: TransactionContext;
    account: Account;
  }) => Promise<void>;

  find: (params: {
    ctx: TransactionContext;
    did: Did;
  }) => Promise<Account | null>;

  delete: (params: { ctx: TransactionContext; did: Did }) => Promise<void>;
}
