import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, exists, lt, sql } from "drizzle-orm";

import type {
  ITimelineRepository,
  TimelinePost,
} from "../application/interfaces/timeline-repository.js";

export class TimelineRepository implements ITimelineRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findPosts({
    authDid,
    before,
    limit,
  }: {
    authDid: string;
    before?: Date;
    limit: number;
  }): Promise<TimelinePost[]> {
    const filters = [];
    if (before) {
      filters.push(lt(schema.posts.sortAt, before));
    }

    const posts = await this.db
      .select({
        uri: schema.posts.uri,
        sortAt: schema.posts.sortAt,
      })
      .from(schema.posts)
      .where(
        and(
          ...filters,
          exists(
            this.db
              .select()
              .from(schema.follows)
              .where(
                and(
                  eq(schema.follows.actorDid, authDid),
                  eq(schema.follows.subjectDid, schema.posts.actorDid),
                ),
              ),
          ),
        ),
      )
      .unionAll(
        this.db
          .select({
            uri: schema.posts.uri,
            sortAt: schema.posts.sortAt,
          })
          .from(schema.posts)
          .where(and(...filters, eq(schema.posts.actorDid, authDid))),
      )
      .orderBy(desc(sql`"sort_at"`))
      .limit(limit + 1);

    return posts;
  }
}
