import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { count, eq, inArray, or } from "drizzle-orm";

export type BackfillStatusDto = { inProgress: number; error: number };

export interface IBackfillQuery {
  countUnfinished: (did: string) => Promise<BackfillStatusDto>;
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
});
