import type { DatabaseClient } from "@repo/common/domain";
import { Like } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, lt } from "drizzle-orm";

import type { ILikeRepository } from "../application/interfaces/like-repository.js";

export class LikeRepository implements ILikeRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findMany(params: {
    subjectUri: string;
    limit: number;
    cursor?: string;
  }): Promise<Like[]> {
    const filters = [eq(schema.likes.subjectUri, params.subjectUri)];

    if (params.cursor) {
      const cursor = new Date(params.cursor);
      filters.push(lt(schema.likes.sortAt, cursor));
    }

    const likes = await this.db
      .select()
      .from(schema.likes)
      .where(and(...filters))
      .orderBy(desc(schema.likes.sortAt))
      .limit(params.limit);

    return likes.map(
      (like) =>
        new Like({
          uri: like.uri,
          cid: like.cid,
          actorDid: like.actorDid,
          subjectUri: like.subjectUri,
          subjectCid: like.subjectCid,
          createdAt: like.createdAt,
          sortAt: like.sortAt,
        }),
    );
  }
}
