import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/interface";
import { schema } from "@repo/db";
import { inArray } from "drizzle-orm";

import type { AccountStatsDto } from "../../../application/dto/account-stats-dto.js";
import type { IAccountStatsQuery } from "../../../application/interfaces/queries/account-stats-query.js";

export class AccountStatsQuery implements IAccountStatsQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findStats(accountDids: Did[]): Promise<AccountStatsDto[]> {
    if (accountDids.length === 0) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(schema.accountStats)
      .where(inArray(schema.accountStats.accountDid, accountDids));
    return rows.map((row) => ({
      accountDid: asDid(row.accountDid),
      followsCount: row.followsCount,
      followersCount: row.followersCount,
      postsCount: row.postsCount,
    }));
  }
}
