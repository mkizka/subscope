import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";

import type { IAccountRepository } from "../../application/interfaces/account-repository.js";
import type { Account } from "../../domain/models/account.js";

export class InMemoryAccountRepository implements IAccountRepository {
  private accounts: Map<Did, Account> = new Map();

  add(account: Account): void {
    this.accounts.set(account.did, account);
  }

  clear(): void {
    this.accounts.clear();
  }

  find(did: Did): Promise<Account | null> {
    return Promise.resolve(this.accounts.get(did) ?? null);
  }

  save(params: { ctx: TransactionContext; account: Account }): Promise<void> {
    this.accounts.set(params.account.did, params.account);
    return Promise.resolve();
  }
}
