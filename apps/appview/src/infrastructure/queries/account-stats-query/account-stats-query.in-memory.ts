import type { Did } from "@atproto/did";

import type { AccountStatsDto } from "../../../application/dto/account-stats-dto.js";
import type { IAccountStatsQuery } from "../../../application/interfaces/queries/account-stats-query.js";

export class InMemoryAccountStatsQuery implements IAccountStatsQuery {
  private stats: Map<string, AccountStatsDto> = new Map();

  add(accountDid: Did, stats: Omit<AccountStatsDto, "accountDid">): void {
    this.stats.set(accountDid, { accountDid, ...stats });
  }

  clear(): void {
    this.stats.clear();
  }

  findStats(accountDids: Did[]): Promise<AccountStatsDto[]> {
    return Promise.resolve(
      accountDids.flatMap((accountDid) => this.stats.get(accountDid) ?? []),
    );
  }
}
