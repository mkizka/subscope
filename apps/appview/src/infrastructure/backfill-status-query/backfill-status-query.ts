import type { Did } from "@atproto/did";
import { asDid } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq, inArray, sql } from "drizzle-orm";

import type {
  BackfillStatus,
  IBackfillStatusQuery,
} from "../../application/interfaces/backfill-status-query.js";

export class BackfillStatusQuery implements IBackfillStatusQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findWithFollows(dids: Did[]): Promise<Map<Did, BackfillStatus>> {
    if (dids.length === 0) {
      return new Map();
    }
    const targets = this.db
      .select({
        ownerDid: sql<string>`${schema.actors.did}`.as("owner_did"),
        targetDid: sql<string>`${schema.actors.did}`.as("target_did"),
      })
      .from(schema.actors)
      .where(inArray(schema.actors.did, dids))
      .unionAll(
        this.db
          .select({
            ownerDid: sql<string>`${schema.follows.actorDid}`.as("owner_did"),
            targetDid: sql<string>`${schema.follows.subjectDid}`.as(
              "target_did",
            ),
          })
          .from(schema.follows)
          .where(inArray(schema.follows.actorDid, dids)),
      )
      .as("targets");
    const rows = await this.db
      .select({
        ownerDid: targets.ownerDid,
        hasError: sql<boolean>`bool_or(${schema.actors.backfillStatus} = 'error')`,
        allCompleted: sql<boolean>`bool_and(coalesce(${schema.actors.backfillStatus} = 'completed', false))`,
      })
      .from(targets)
      .innerJoin(schema.actors, eq(schema.actors.did, targets.targetDid))
      .groupBy(targets.ownerDid);
    return new Map<Did, BackfillStatus>(
      rows.map((row) => [
        asDid(row.ownerDid),
        row.hasError ? "error" : row.allCompleted ? "completed" : "inProgress",
      ]),
    );
  }
}
