import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

export interface IFollowQuery {
  findRegisteredFollowerDids: (subjectDid: string) => Promise<string[]>;
}

export const followQueryFactory = ({
  db,
}: {
  db: DatabaseClient;
}): IFollowQuery => ({
  async findRegisteredFollowerDids(subjectDid) {
    const rows = await db
      .select({ did: schema.follows.accountDid })
      .from(schema.follows)
      .innerJoin(
        schema.registrations,
        eq(schema.follows.accountDid, schema.registrations.accountDid),
      )
      .where(eq(schema.follows.subjectDid, subjectDid));
    return rows.map((row) => row.did);
  },
});
