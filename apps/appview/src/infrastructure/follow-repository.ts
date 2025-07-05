import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { Follow } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, lt } from "drizzle-orm";

import type { IFollowRepository } from "../application/interfaces/follow-repository.js";

export class FollowRepository implements IFollowRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findFollows(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<Follow[]> {
    const filters = [eq(schema.follows.actorDid, params.actorDid.toString())];

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
        }),
    );
  }

  async findFollowers(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<Follow[]> {
    const filters = [eq(schema.follows.subjectDid, params.actorDid.toString())];

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
        }),
    );
  }
}
