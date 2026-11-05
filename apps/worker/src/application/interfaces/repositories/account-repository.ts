import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

import type { Account } from "../../../domain/account.js";

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
