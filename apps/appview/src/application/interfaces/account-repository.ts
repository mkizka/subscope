import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/interface";

import type { Account } from "../../domain/models/account.js";

export interface IAccountRepository {
  find: (did: Did) => Promise<Account | null>;
  save: (params: {
    ctx: TransactionContext;
    account: Account;
  }) => Promise<void>;
}
