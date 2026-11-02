import type { BackfillStatus, DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, count, eq, inArray, or } from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";

export type BackfillStatusDto = { inProgress: number; error: number };

export interface IBackfillQuery {
  countUnfinished: (did: string) => Promise<BackfillStatusDto>;
  findTrackedStatuses: (
    dids: string[],
  ) => Promise<Record<string, BackfillStatus>>;
}

export const backfillQueryFactory = ({
  db,
}: {
  db: DatabaseClient;
}): IBackfillQuery => ({
  async countUnfinished(did) {
    const followees = db
      .select({ did: schema.follows.subjectDid })
      .from(schema.follows)
      .where(eq(schema.follows.actorDid, did));
    const rows = await db
      .select({ status: schema.actors.backfillStatus, count: count() })
      .from(schema.actors)
      .where(
        or(eq(schema.actors.did, did), inArray(schema.actors.did, followees)),
      )
      .groupBy(schema.actors.backfillStatus);
    const countOf = (status: "inProgress" | "error" | null) =>
      rows.find((row) => row.status === status)?.count ?? 0;
    return {
      inProgress: countOf("inProgress") + countOf(null),
      error: countOf("error"),
    };
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
