import type { Did } from "@atproto/did";
import type { Account } from "@repo/common/domain";

import type { IAccountQuery } from "../../../application/interfaces/queries/account-query.js";

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

  findBannedDids(params: { limit: number; cursor?: string }): Promise<Did[]> {
    const dids = [...this.accounts.values()]
      .filter((account) => account.isBanned)
      .map((account) => account.did)
      .filter((did) => !params.cursor || did > params.cursor)
      .sort()
      .slice(0, params.limit);
    return Promise.resolve(dids);
  }
}
