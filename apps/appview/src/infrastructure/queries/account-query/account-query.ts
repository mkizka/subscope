import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, asc, eq, gt } from "drizzle-orm";

import type { IAccountQuery } from "../../../application/interfaces/queries/account-query.js";

export class AccountQuery implements IAccountQuery {
  constructor(private readonly db: DatabaseClient) {}

  async hasAnyAdmin(): Promise<boolean> {
    const rows = await this.db
      .select({ did: schema.accounts.did })
      .from(schema.accounts)
      .where(eq(schema.accounts.isAdmin, true))
      .limit(1);
    return rows.length > 0;
  }

  async findBannedDids(params: {
    limit: number;
    cursor?: string;
  }): Promise<Did[]> {
    const rows = await this.db
      .select({ did: schema.accounts.did })
      .from(schema.accounts)
      .where(
        and(
          eq(schema.accounts.isBanned, true),
          params.cursor ? gt(schema.accounts.did, params.cursor) : undefined,
        ),
      )
      .orderBy(asc(schema.accounts.did))
      .limit(params.limit);
    return rows.map((row) => asDid(row.did));
  }
}
