import { asDid, type Did } from "@atproto/did";
import { asAtUriString } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/interface";
import { schema } from "@repo/db";
import { and, desc, eq, inArray, lt, type SQL } from "drizzle-orm";

import type {
  FollowDto,
  FolloweeDto,
  FollowerDto,
} from "../../../application/dto/follow-dto.js";
import type { IFollowQuery } from "../../../application/interfaces/queries/follow-query.js";

export class FollowQuery implements IFollowQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findFollows(params: {
    accountDids: Did[];
    subjectDids: Did[];
  }): Promise<FollowDto[]> {
    if (params.accountDids.length === 0 || params.subjectDids.length === 0) {
      return [];
    }
    const follows = await this.db.query.follows.findMany({
      where: and(
        inArray(schema.follows.accountDid, params.accountDids),
        inArray(schema.follows.subjectDid, params.subjectDids),
      ),
    });
    return follows.map((follow) => ({
      uri: asAtUriString(follow.uri),
      accountDid: asDid(follow.accountDid),
      subjectDid: asDid(follow.subjectDid),
    }));
  }

  async findAccountFollows(params: {
    accountDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<FolloweeDto[]> {
    const results = await this.findPage(
      eq(schema.follows.accountDid, params.accountDid),
      params,
    );
    return results.map((result) => ({
      subjectDid: asDid(result.subjectDid),
      sortAt: result.sortAt,
    }));
  }

  async findAccountFollowers(params: {
    accountDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<FollowerDto[]> {
    const results = await this.findPage(
      eq(schema.follows.subjectDid, params.accountDid),
      params,
    );
    return results.map((result) => ({
      accountDid: asDid(result.accountDid),
      sortAt: result.sortAt,
    }));
  }

  async findFolloweeDids(accountDid: Did): Promise<Did[]> {
    const results = await this.db
      .select({ subjectDid: schema.follows.subjectDid })
      .from(schema.follows)
      .where(eq(schema.follows.accountDid, accountDid));
    return results.map((result) => asDid(result.subjectDid));
  }

  private findPage(filter: SQL, params: { limit: number; cursor?: string }) {
    return this.db.query.follows.findMany({
      where: and(
        filter,
        params.cursor
          ? lt(schema.follows.sortAt, new Date(params.cursor))
          : undefined,
      ),
      orderBy: [desc(schema.follows.sortAt)],
      limit: params.limit,
    });
  }
}
