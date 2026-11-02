import type { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { inArray } from "drizzle-orm";

import type { PostStatsDto } from "../../../application/dto/post-stats-dto.js";
import type { IPostStatsQuery } from "../../../application/interfaces/queries/post-stats-query.js";

export class PostStatsQuery implements IPostStatsQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findStats(uris: AtUri[]): Promise<PostStatsDto[]> {
    if (uris.length === 0) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(schema.postStats)
      .where(
        inArray(
          schema.postStats.postUri,
          uris.map((uri) => uri.toString()),
        ),
      );
    return rows.map((row) => ({
      uri: row.postUri,
      likeCount: row.likeCount,
      repostCount: row.repostCount,
      replyCount: row.replyCount,
      quoteCount: row.quoteCount,
    }));
  }
}
