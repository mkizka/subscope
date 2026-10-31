import { asDid, type Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { Follow } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, lt } from "drizzle-orm";

import type { IFollowRepository } from "../../application/interfaces/follow-repository.js";

export class FollowRepository implements IFollowRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findFollows(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<Follow[]> {
    const filters = [eq(schema.follows.actorDid, params.actorDid)];

    if (params.cursor) {
      const cursor = new Date(params.cursor);
      filters.push(lt(schema.follows.sortAt, cursor));
    }

    const results = await this.db.query.follows.findMany({
      where: and(...filters),
      orderBy: [desc(schema.follows.sortAt)],
      limit: params.limit,
    });

    return results.map(
      (result) =>
        new Follow({
          uri: result.uri,
          cid: result.cid,
          actorDid: result.actorDid,
          subjectDid: result.subjectDid,
          createdAt: result.createdAt,
          indexedAt: result.indexedAt,
        }),
    );
  }

  async findFolloweeDids(actorDid: Did): Promise<Did[]> {
    const results = await this.db
      .select({ subjectDid: schema.follows.subjectDid })
      .from(schema.follows)
      .where(eq(schema.follows.actorDid, actorDid));
    return results.map((result) => asDid(result.subjectDid));
  }

  async findFollowers(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<Follow[]> {
    const filters = [eq(schema.follows.subjectDid, params.actorDid)];

    if (params.cursor) {
      const cursor = new Date(params.cursor);
      filters.push(lt(schema.follows.sortAt, cursor));
    }

    const results = await this.db.query.follows.findMany({
      where: and(...filters),
      orderBy: [desc(schema.follows.sortAt)],
      limit: params.limit,
    });

    return results.map(
      (result) =>
        new Follow({
          uri: result.uri,
          cid: result.cid,
          actorDid: result.actorDid,
          subjectDid: result.subjectDid,
          createdAt: result.createdAt,
          indexedAt: result.indexedAt,
        }),
    );
  }
}
