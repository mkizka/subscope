import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

export type BackfillStatusDto = {
  status: "inProgress" | "completed" | "error";
};

export interface IBackfillQuery {
  findStatus: (did: string) => Promise<BackfillStatusDto>;
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
});
