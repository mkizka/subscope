import { asDid } from "@atproto/did";
import { asAtUriString, type AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { inArray } from "drizzle-orm";

import type { PostDto } from "../../application/dto/post-dto.js";
import type { IPostQuery } from "../../application/interfaces/post-query.js";

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
  indexedAt: post.indexedAt,
});

export class PostQuery implements IPostQuery {
  constructor(private readonly db: DatabaseClient) {}

  async findByUris(uris: AtUri[]): Promise<PostDto[]> {
    const posts = await this.db.query.posts.findMany({
      where: inArray(
        schema.posts.uri,
        uris.map((uri) => uri.toString()),
      ),
      with: {
        embedImages: {
          orderBy: (embedImages, { asc }) => [asc(embedImages.position)],
        },
        embedExternal: true,
        embedRecord: true,
      },
    });
    return posts.map(toPostDto);
  }
}
