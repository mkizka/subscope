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
      .select({ status: schema.actors.backfillStatus })
      .from(schema.actors)
      .where(eq(schema.actors.did, did))
      .limit(1);
    return { status: row?.status ?? "inProgress" };
  },
  async findTrackedStatuses(dids) {
    if (dids.length === 0) {
      return {};
    }
    const trackedDids = union(
      db
        .select({ did: schema.subscriptions.actorDid })
        .from(schema.subscriptions),
      db
        .select({ did: schema.follows.subjectDid })
        .from(schema.follows)
        .innerJoin(
          schema.subscriptions,
          eq(schema.follows.actorDid, schema.subscriptions.actorDid),
        ),
    );
    const rows = await db
      .select({ did: schema.actors.did, status: schema.actors.backfillStatus })
      .from(schema.actors)
      .where(
        and(
          inArray(schema.actors.did, dids),
          inArray(schema.actors.did, trackedDids),
        ),
      );
    return Object.fromEntries(
      rows.map((row) => [row.did, row.status ?? "inProgress"]),
    );
  },
});
