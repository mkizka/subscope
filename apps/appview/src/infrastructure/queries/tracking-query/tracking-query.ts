import { asDid, type Did } from "@atproto/did";
import { type DatabaseClient } from "@repo/common/interface";
import { type BackfillStatus, schema } from "@repo/db";
import { and, eq, inArray } from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";

import type { ITrackingQuery } from "../../../application/interfaces/queries/tracking-query.js";

export class TrackingQuery implements ITrackingQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findStatuses(
    dids: Did[],
  ): Promise<
    { did: Did; isMember: boolean; backfillStatus: BackfillStatus }[]
  > {
    if (dids.length === 0) {
      return [];
    }
    const { accounts, follows, registrations } = schema;
    const trackedDids = union(
      this.db.select({ did: registrations.accountDid }).from(registrations),
      this.db
        .select({ did: follows.subjectDid })
        .from(follows)
        .innerJoin(
          registrations,
          eq(follows.accountDid, registrations.accountDid),
        ),
    );
    const rows = await this.db
      .select({
        did: accounts.did,
        memberDid: registrations.accountDid,
        backfillStatus: accounts.backfillStatus,
      })
      .from(accounts)
      .leftJoin(registrations, eq(registrations.accountDid, accounts.did))
      .where(
        and(inArray(accounts.did, dids), inArray(accounts.did, trackedDids)),
      );
    return rows.map((row) => ({
      did: asDid(row.did),
      isMember: row.memberDid !== null,
      backfillStatus: row.backfillStatus ?? "inProgress",
    }));
  }
}
