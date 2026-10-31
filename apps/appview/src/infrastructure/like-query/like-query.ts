import type { Did } from "@atproto/did";
import { asAtUriString, type AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, eq, inArray } from "drizzle-orm";

import type { LikeDto } from "../../application/dto/like-dto.js";
import type { ILikeQuery } from "../../application/interfaces/like-query.js";

export class LikeQuery implements ILikeQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findViewerLikes({
    viewerDid,
    subjectUris,
  }: {
    viewerDid: Did;
    subjectUris: AtUri[];
  }): Promise<LikeDto[]> {
    if (subjectUris.length === 0) {
      return [];
    }
    const rows = await this.db
      .select({ uri: schema.likes.uri, subjectUri: schema.likes.subjectUri })
      .from(schema.likes)
      .where(
        and(
          eq(schema.likes.actorDid, viewerDid),
          inArray(
            schema.likes.subjectUri,
            subjectUris.map((uri) => uri.toString()),
          ),
        ),
      );
    return rows.map((row) => ({
      uri: asAtUriString(row.uri),
      subjectUri: asAtUriString(row.subjectUri),
    }));
  }
}
