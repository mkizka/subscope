import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { Like } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, lt } from "drizzle-orm";

import type { ILikeRepository } from "../application/interfaces/like-repository.js";

export class LikeRepository implements ILikeRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findMany({
    subjectUri,
    limit,
    cursor,
  }: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }): Promise<Like[]> {
    const filters = [eq(schema.likes.subjectUri, subjectUri)];

    if (cursor) {
      filters.push(lt(schema.likes.sortAt, cursor));
    }

    const likes = await this.db
      .select()
      .from(schema.likes)
      .where(and(...filters))
      .orderBy(desc(schema.likes.sortAt))
      .limit(limit);

    return likes.map(
      (like) =>
        new Like({
          uri: like.uri,
          cid: like.cid,
          actorDid: like.actorDid,
          subjectUri: like.subjectUri,
          subjectCid: like.subjectCid,
          createdAt: like.createdAt,
          indexedAt: like.indexedAt,
          sortAt: like.sortAt,
        }),
    );
  }

  async findLikesByActor({
    actorDid,
    limit,
    cursor,
  }: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<Like[]> {
    const filters = [eq(schema.likes.actorDid, actorDid.toString())];

    if (cursor) {
      const cursorDate = new Date(cursor);
      filters.push(lt(schema.likes.sortAt, cursorDate));
    }

    const likes = await this.db
      .select()
      .from(schema.likes)
      .where(and(...filters))
      .orderBy(desc(schema.likes.sortAt))
      .limit(limit);

    return likes.map(
      (like) =>
        new Like({
          uri: like.uri,
          cid: like.cid,
          actorDid: like.actorDid,
          subjectUri: like.subjectUri,
          subjectCid: like.subjectCid,
          createdAt: like.createdAt,
          indexedAt: like.indexedAt,
          sortAt: like.sortAt,
        }),
    );
  }
}
