import { asDid } from "@atproto/did";
import { asAtUriString, type AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/interface";
import { schema } from "@repo/db";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
} from "drizzle-orm";

import type { PostDto } from "../../../application/dto/post-dto.js";
import type { IPostQuery } from "../../../application/interfaces/queries/post-query.js";

type SelectPost = typeof schema.posts.$inferSelect & {
  embedImages: (typeof schema.postEmbedImages.$inferSelect)[];
  embedVideo: typeof schema.postEmbedVideos.$inferSelect | null;
  embedExternal: typeof schema.postEmbedExternals.$inferSelect | null;
  embedRecord: typeof schema.postEmbedRecords.$inferSelect | null;
};

const toImageDtos = (
  images: SelectPost["embedImages"],
  embedType: "images" | "gallery",
) =>
  images
    .filter((image) => image.embedType === embedType)
    .map((image) => ({
      cid: image.cid,
      alt: image.alt,
      aspectRatio:
        image.aspectRatioWidth && image.aspectRatioHeight
          ? { width: image.aspectRatioWidth, height: image.aspectRatioHeight }
          : undefined,
    }));

const toPostDto = (post: SelectPost): PostDto => ({
  uri: asAtUriString(post.uri),
  accountDid: asDid(post.accountDid),
  embedImages: toImageDtos(post.embedImages, "images"),
  embedGallery: toImageDtos(post.embedImages, "gallery"),
  embedVideo: post.embedVideo && {
    cid: post.embedVideo.cid,
    alt: post.embedVideo.alt,
    aspectRatio:
      post.embedVideo.aspectRatioWidth && post.embedVideo.aspectRatioHeight
        ? {
            width: post.embedVideo.aspectRatioWidth,
            height: post.embedVideo.aspectRatioHeight,
          }
        : undefined,
    presentation: post.embedVideo.presentation,
  },
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
  embedVideo: true,
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

  async findQuotes(params: {
    uri: string;
    limit: number;
    cursor?: Date;
  }): Promise<PostDto[]> {
    const posts = await this.db.query.posts.findMany({
      where: and(
        inArray(
          schema.posts.uri,
          this.db
            .select({ uri: schema.postEmbedRecords.postUri })
            .from(schema.postEmbedRecords)
            .where(eq(schema.postEmbedRecords.uri, params.uri)),
        ),
        params.cursor && lt(schema.posts.sortAt, params.cursor),
      ),
      orderBy: desc(schema.posts.sortAt),
      limit: params.limit,
      with: withEmbeds,
    });
    return posts.map(toPostDto);
  }

  async search(params: {
    terms: string[];
    authorDids?: string[];
    replies?: "only" | "exclude";
    limit: number;
    cursor?: Date;
  }): Promise<PostDto[]> {
    const posts = await this.db.query.posts.findMany({
      where: and(
        ...params.terms.map((term) =>
          ilike(schema.posts.text, `%${term.replace(/[%_\\]/g, "\\$&")}%`),
        ),
        params.authorDids &&
          inArray(schema.posts.accountDid, params.authorDids),
        params.replies === "only"
          ? isNotNull(schema.posts.replyParentUri)
          : undefined,
        params.replies === "exclude"
          ? isNull(schema.posts.replyParentUri)
          : undefined,
        params.cursor && lt(schema.posts.sortAt, params.cursor),
      ),
      orderBy: desc(schema.posts.sortAt),
      limit: params.limit,
      with: withEmbeds,
    });
    return posts.map(toPostDto);
  }
}
