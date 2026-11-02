import { asDid, type Did } from "@atproto/did";
import { asAtUriString } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { Follow } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, inArray, lt, type SQL } from "drizzle-orm";

import type { FollowDto } from "../../application/dto/follow-dto.js";
import type { IFollowQuery } from "../../application/interfaces/follow-query.js";

export class FollowQuery implements IFollowQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findFollows(params: {
    actorDids: Did[];
    subjectDids: Did[];
  }): Promise<FollowDto[]> {
    if (params.actorDids.length === 0 || params.subjectDids.length === 0) {
      return [];
    }
    const follows = await this.db.query.follows.findMany({
      where: and(
        inArray(schema.follows.actorDid, params.actorDids),
        inArray(schema.follows.subjectDid, params.subjectDids),
      ),
    });
    return follows.map((follow) => ({
      uri: asAtUriString(follow.uri),
      actorDid: asDid(follow.actorDid),
      subjectDid: asDid(follow.subjectDid),
    }));
  }

  findActorFollows(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<Follow[]> {
    return this.findPage(eq(schema.follows.actorDid, params.actorDid), params);
  }

  findActorFollowers(params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<Follow[]> {
    return this.findPage(
      eq(schema.follows.subjectDid, params.actorDid),
      params,
    );
  }

  async findFolloweeDids(actorDid: Did): Promise<Did[]> {
    const results = await this.db
      .select({ subjectDid: schema.follows.subjectDid })
      .from(schema.follows)
      .where(eq(schema.follows.actorDid, actorDid));
    return results.map((result) => asDid(result.subjectDid));
  }

  private async findPage(
    filter: SQL,
    params: { limit: number; cursor?: string },
  ): Promise<Follow[]> {
    const results = await this.db.query.follows.findMany({
      where: and(
        filter,
        params.cursor
          ? lt(schema.follows.sortAt, new Date(params.cursor))
          : undefined,
      ),
      orderBy: [desc(schema.follows.sortAt)],
      limit: params.limit,
    });
    return results.map((result) => new Follow(result));
  }
}
