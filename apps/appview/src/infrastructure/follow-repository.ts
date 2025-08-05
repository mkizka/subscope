import { asDid, type Did } from "@atproto/did";
import { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { Follow } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, inArray, lt } from "drizzle-orm";

import type { IFollowRepository } from "../application/interfaces/follow-repository.js";

export class FollowRepository implements IFollowRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

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

  async findFollowingMap(params: {
    actorDid: Did;
    targetDids: Did[];
  }): Promise<Map<Did, AtUri>> {
    if (params.targetDids.length === 0) {
      return new Map();
    }

    const results = await this.db.query.follows.findMany({
      where: and(
        eq(schema.follows.actorDid, params.actorDid),
        inArray(schema.follows.subjectDid, params.targetDids),
      ),
    });

    const followingMap = new Map<Did, AtUri>();
    for (const result of results) {
      followingMap.set(asDid(result.subjectDid), new AtUri(result.uri));
    }

    return followingMap;
  }

  async findFollowedByMap(params: {
    actorDid: Did;
    targetDids: Did[];
  }): Promise<Map<Did, AtUri>> {
    if (params.targetDids.length === 0) {
      return new Map();
    }

    const results = await this.db.query.follows.findMany({
      where: and(
        inArray(schema.follows.actorDid, params.targetDids),
        eq(schema.follows.subjectDid, params.actorDid),
      ),
    });

    const followedByMap = new Map<Did, AtUri>();
    for (const result of results) {
      followedByMap.set(asDid(result.actorDid), new AtUri(result.uri));
    }

    return followedByMap;
  }
}
