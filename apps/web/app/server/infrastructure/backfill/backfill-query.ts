import type { BackfillStatus, DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, eq, inArray } from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";

export type BackfillStatusDto = {
  status: "inProgress" | "completed" | "error";
};

export interface IBackfillQuery {
  findStatus: (did: string) => Promise<BackfillStatusDto>;
  findTrackedStatuses: (
    dids: string[],
  ) => Promise<Record<string, BackfillStatus>>;
}

export const backfillQueryFactory = ({
  db,
}: {
  db: DatabaseClient;
}): IBackfillQuery => ({
  async findStatus(did) {
    const [row] = await db
      .select({ status: schema.accounts.backfillStatus })
      .from(schema.accounts)
      .where(eq(schema.accounts.did, did))
      .limit(1);
    return { status: row?.status ?? "inProgress" };
  },
  async findTrackedStatuses(dids) {
    if (dids.length === 0) {
      return {};
    }
    const trackedDids = union(
      db
        .select({ did: schema.registrations.accountDid })
        .from(schema.registrations),
      db
        .select({ did: schema.follows.subjectDid })
        .from(schema.follows)
        .innerJoin(
          schema.registrations,
          eq(schema.follows.accountDid, schema.registrations.accountDid),
        ),
    );
    const rows = await db
      .select({
        did: schema.accounts.did,
        status: schema.accounts.backfillStatus,
      })
      .from(schema.accounts)
      .where(
        and(
          inArray(schema.accounts.did, dids),
          inArray(schema.accounts.did, trackedDids),
        ),
      );
    return Object.fromEntries(
      rows.map((row) => [row.did, row.status ?? "inProgress"]),
    );
  },
});
