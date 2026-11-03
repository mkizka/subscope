import type { Did } from "@atproto/did";
import type { TransactionContext } from "@repo/common/domain";

import type { IAccountRepository } from "../../../application/interfaces/repositories/account-repository.js";
import type { Account } from "../../../domain/account.js";

export class InMemoryAccountRepository implements IAccountRepository {
  private accounts: Map<Did, Account> = new Map();

  add(account: Account): void {
    this.accounts.set(account.did, account);
  }

  clear(): void {
    this.accounts.clear();
  }

  async save(params: {
    ctx: TransactionContext;
    account: Account;
  }): Promise<void> {
    this.accounts.set(params.account.did, params.account);
  }

  async find(params: {
    ctx: TransactionContext;
    did: Did;
  }): Promise<Account | null> {
    return this.accounts.get(params.did) ?? null;
  }

  async delete(params: { ctx: TransactionContext; did: Did }): Promise<void> {
    this.accounts.delete(params.did);
  }
}
