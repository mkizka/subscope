import { asDid } from "@atproto/did";
import { asAtUriString, type AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, asc, desc, eq, ilike, inArray, isNull, lt } from "drizzle-orm";

import type { PostDto } from "../../../application/dto/post-dto.js";
import type { IPostQuery } from "../../../application/interfaces/queries/post-query.js";

type SelectPost = typeof schema.posts.$inferSelect & {
  embedImages: (typeof schema.postEmbedImages.$inferSelect)[];
  embedExternal: typeof schema.postEmbedExternals.$inferSelect | null;
  embedRecord: typeof schema.postEmbedRecords.$inferSelect | null;
};

const toPostDto = (post: SelectPost): PostDto => ({
  uri: asAtUriString(post.uri),
  actorDid: asDid(post.actorDid),
  embedImages: post.embedImages.map((image) => ({
    cid: image.cid,
    alt: image.alt,
    aspectRatio:
      image.aspectRatioWidth && image.aspectRatioHeight
        ? { width: image.aspectRatioWidth, height: image.aspectRatioHeight }
        : undefined,
  })),
  embedExternal: post.embedExternal && {
    uri: post.embedExternal.uri,
    title: post.embedExternal.title,
    description: post.embedExternal.description,
    thumbCid: post.embedExternal.thumbCid,
  },
  embedRecordUri: post.embedRecord?.uri ?? null,
  replyRootUri: post.replyRootUri,
  replyParentUri: post.replyParentUri,
  indexedAt: post.indexedAt,
  sortAt: post.sortAt,
});

const withEmbeds = {
  embedImages: {
    orderBy: asc(schema.postEmbedImages.position),
  },
  embedExternal: true,
  embedRecord: true,
} as const;

export class PostQuery implements IPostQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findByUris(uris: AtUri[]): Promise<PostDto[]> {
    const posts = await this.db.query.posts.findMany({
      where: inArray(
        schema.posts.uri,
        uris.map((uri) => uri.toString()),
      ),
      with: withEmbeds,
    });
    return posts.map(toPostDto);
  }

  async findReplies(uri: AtUri, limit?: number): Promise<PostDto[]> {
    const posts = await this.db.query.posts.findMany({
      where: eq(schema.posts.replyParentUri, uri.toString()),
      orderBy: asc(schema.posts.sortAt),
      limit,
      with: withEmbeds,
    });
    return posts.map(toPostDto);
  }

  async search(params: {
    query: string;
    limit: number;
    cursor?: Date;
  }): Promise<PostDto[]> {
    const escapedQuery = params.query.replace(/[%_]/g, "\\$&");
    const posts = await this.db.query.posts.findMany({
      where: and(
        ilike(schema.posts.text, `%${escapedQuery}%`),
        isNull(schema.posts.replyParentUri),
        params.cursor && lt(schema.posts.sortAt, params.cursor),
      ),
      orderBy: desc(schema.posts.sortAt),
      limit: params.limit,
      with: withEmbeds,
    });
    return posts.map(toPostDto);
  }
}
