import type { Did } from "@atproto/did";

import type { IAccountQuery } from "../../../application/interfaces/queries/account-query.js";
import type { Account } from "../../../domain/models/account.js";

export class InMemoryAccountQuery implements IAccountQuery {
  private accounts: Map<Did, Account> = new Map();

  add(account: Account): void {
    this.accounts.set(account.did, account);
  }

  clear(): void {
    this.accounts.clear();
  }

  hasAnyAdmin(): Promise<boolean> {
    return Promise.resolve(
      [...this.accounts.values()].some((account) => account.isAdmin),
    );
  }

  findRepoRev(): Promise<string | null> {
    return Promise.resolve(null);
  }
}
