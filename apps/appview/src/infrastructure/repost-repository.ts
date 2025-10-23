import type { Did } from "@atproto/did";
import type { DatabaseClient } from "@repo/common/domain";
import { Repost } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, inArray, lt } from "drizzle-orm";

import type { IRepostRepository } from "../application/interfaces/repost-repository.js";

export class RepostRepository implements IRepostRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async findRepostsByPost({
    subjectUri,
    limit,
    cursor,
  }: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }): Promise<Repost[]> {
    const filters = [eq(schema.reposts.subjectUri, subjectUri)];

    if (cursor) {
      filters.push(lt(schema.reposts.sortAt, cursor));
    }

    const reposts = await this.db
      .select()
      .from(schema.reposts)
      .where(and(...filters))
      .orderBy(desc(schema.reposts.sortAt))
      .limit(limit);

    return reposts.map(
      (repost) =>
        new Repost({
          uri: repost.uri,
          cid: repost.cid,
          actorDid: repost.actorDid,
          subjectUri: repost.subjectUri,
          subjectCid: repost.subjectCid,
          createdAt: repost.createdAt,
          indexedAt: repost.indexedAt,
        }),
    );
  }

  async findByUris(uris: string[]): Promise<Repost[]> {
    const reposts = await this.db
      .select()
      .from(schema.reposts)
      .where(inArray(schema.reposts.uri, uris));

    return reposts.map(
      (repost) =>
        new Repost({
          uri: repost.uri,
          cid: repost.cid,
          actorDid: repost.actorDid,
          subjectUri: repost.subjectUri,
          subjectCid: repost.subjectCid,
          createdAt: repost.createdAt,
          indexedAt: repost.indexedAt,
        }),
    );
  }

  async findViewerReposts({
    viewerDid,
    subjectUris,
  }: {
    viewerDid: Did;
    subjectUris: string[];
  }): Promise<Repost[]> {
    const reposts = await this.db
      .select()
      .from(schema.reposts)
      .where(
        and(
          eq(schema.reposts.actorDid, viewerDid),
          inArray(schema.reposts.subjectUri, subjectUris),
        ),
      );

    return reposts.map(
      (repost) =>
        new Repost({
          uri: repost.uri,
          cid: repost.cid,
          actorDid: repost.actorDid,
          subjectUri: repost.subjectUri,
          subjectCid: repost.subjectCid,
          createdAt: repost.createdAt,
          indexedAt: repost.indexedAt,
        }),
    );
  }
}
