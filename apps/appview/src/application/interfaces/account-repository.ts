import type { Did } from "@atproto/did";
import type { Account, TransactionContext } from "@repo/common/domain";

export interface IAccountRepository {
  find: (did: Did) => Promise<Account | null>;
  save: (params: {
    ctx: TransactionContext;
    account: Account;
  }) => Promise<void>;
}
