import { asDid, type Did } from "@atproto/did";
import { type DatabaseClient } from "@repo/common/interface";
import { type BackfillStatus, schema } from "@repo/db";
import { eq, inArray } from "drizzle-orm";

import type { IBackfillStatusQuery } from "../../../application/interfaces/queries/backfill-status-query.js";

export class BackfillStatusQuery implements IBackfillStatusQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findStatuses(
    dids: Did[],
  ): Promise<{ did: Did; backfillStatus: BackfillStatus }[]> {
    if (dids.length === 0) {
      return [];
    }
    const { accounts, registrations } = schema;
    const rows = await this.db
      .select({
        did: accounts.did,
        backfillStatus: accounts.backfillStatus,
      })
      .from(accounts)
      .innerJoin(registrations, eq(registrations.accountDid, accounts.did))
      .where(inArray(accounts.did, dids));
    return rows.map((row) => ({
      did: asDid(row.did),
      backfillStatus: row.backfillStatus ?? "inProgress",
    }));
  }
}
