import { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@repo/common/domain";
import {
  Post,
  PostEmbedExternal,
  PostEmbedImage,
  PostEmbedRecord,
  PostEmbedRecordWithMedia,
} from "@repo/common/domain";
import { schema } from "@repo/db";
import { and, desc, eq, ilike, inArray, isNull, lt } from "drizzle-orm";

import type { IPostRepository } from "@/server/features/xrpc/application/interfaces/post-repository.js";

const getStrongRef = (uri: string | null, cid: string | null) => {
  if (uri === null || cid === null) {
    return null;
  }
  return {
    uri: new AtUri(uri),
    cid,
  };
};

type SelectPostEmbedImage = typeof schema.postEmbedImages.$inferSelect;

type SelectPostEmbedExternal = typeof schema.postEmbedExternals.$inferSelect;

type SelectPostEmbedRecord = typeof schema.postEmbedRecords.$inferSelect;

type SelectPost = typeof schema.posts.$inferSelect & {
  embedImages: SelectPostEmbedImage[];
  embedExternal: SelectPostEmbedExternal | null;
  embedRecord: SelectPostEmbedRecord | null;
};

export class PostRepository implements IPostRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  private createPostEmbedImage(image: SelectPostEmbedImage): PostEmbedImage {
    return new PostEmbedImage({
      cid: image.cid,
      position: image.position,
      alt: image.alt,
      aspectRatio:
        image.aspectRatioWidth && image.aspectRatioHeight
          ? {
              width: image.aspectRatioWidth,
              height: image.aspectRatioHeight,
            }
          : undefined,
    });
  }

  private postEmbedImages(images: SelectPostEmbedImage[]): PostEmbedImage[] {
    return images.map((image) => this.createPostEmbedImage(image));
  }

  private postEmbedExternal(
    external: SelectPostEmbedExternal,
  ): PostEmbedExternal {
    return new PostEmbedExternal(
      external.uri,
      external.title,
      external.description,
      external.thumbCid,
    );
  }

  private postEmbedRecord(record: SelectPostEmbedRecord): PostEmbedRecord {
    return new PostEmbedRecord({
      uri: record.uri,
      cid: record.cid,
    });
  }

  private recordWithMedia(
    record: SelectPostEmbedRecord,
    media: PostEmbedImage[] | PostEmbedExternal,
  ): PostEmbedRecordWithMedia {
    return new PostEmbedRecordWithMedia({
      uri: record.uri,
      cid: record.cid,
      media,
    });
  }

  private embed(post: SelectPost) {
    // レコードと画像の両方がある場合
    if (post.embedRecord && post.embedImages.length > 0) {
      return this.recordWithMedia(
        post.embedRecord,
        this.postEmbedImages(post.embedImages),
      );
    }

    // レコードと外部リンクの両方がある場合
    if (post.embedRecord && post.embedExternal) {
      return this.recordWithMedia(
        post.embedRecord,
        this.postEmbedExternal(post.embedExternal),
      );
    }

    //  外部リンクのみ
    if (post.embedExternal) {
      return this.postEmbedExternal(post.embedExternal);
    }

    // 画像のみ
    if (post.embedImages.length > 0) {
      return this.postEmbedImages(post.embedImages);
    }

    // レコードのみ
    if (post.embedRecord) {
      return this.postEmbedRecord(post.embedRecord);
    }

    return null;
  }

  private post(post: SelectPost) {
    return new Post({
      uri: post.uri,
      cid: post.cid,
      actorDid: post.actorDid,
      text: post.text,
      replyRoot: getStrongRef(post.replyRootUri, post.replyRootCid),
      replyParent: getStrongRef(post.replyParentUri, post.replyParentCid),
      langs: post.langs,
      embed: this.embed(post),
      createdAt: post.createdAt,
      indexedAt: post.indexedAt,
    });
  }

  async findByUris(uris: AtUri[]) {
    const postsWithEmbeds = await this.db.query.posts.findMany({
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
    return postsWithEmbeds.map((post) => this.post(post));
  }

  async findMany(params: { limit: number; cursor?: string }) {
    const filters = [];
    if (params.cursor) {
      const cursor = new Date(params.cursor);
      filters.push(lt(schema.posts.sortAt, cursor));
    }

    const postsWithEmbeds = await this.db.query.posts.findMany({
      where: and(...filters),
      orderBy: (posts, { desc }) => [desc(posts.sortAt)],
      limit: params.limit,
      with: {
        embedImages: {
          orderBy: (embedImages, { asc }) => [asc(embedImages.position)],
        },
        embedExternal: true,
        embedRecord: true,
      },
    });
    return postsWithEmbeds.map((post) => this.post(post));
  }

  async findByUri(uri: AtUri): Promise<Post | null> {
    const postWithEmbeds = await this.db.query.posts.findFirst({
      where: eq(schema.posts.uri, uri.toString()),
      with: {
        embedImages: {
          orderBy: (embedImages, { asc }) => [asc(embedImages.position)],
        },
        embedExternal: true,
        embedRecord: true,
      },
    });

    if (!postWithEmbeds) {
      return null;
    }

    return this.post(postWithEmbeds);
  }

  async findReplies(uri: AtUri, limit?: number): Promise<Post[]> {
    const postsWithEmbeds = await this.db.query.posts.findMany({
      where: eq(schema.posts.replyParentUri, uri.toString()),
      orderBy: (posts, { asc }) => [asc(posts.sortAt)],
      limit,
      with: {
        embedImages: {
          orderBy: (embedImages, { asc }) => [asc(embedImages.position)],
        },
        embedExternal: true,
        embedRecord: true,
      },
    });

    return postsWithEmbeds.map((post) => this.post(post));
  }

  private escapeWildcards(query: string): string {
    return query.replace(/[%_]/g, "\\$&");
  }

  async search(params: {
    query: string;
    limit: number;
    cursor?: string;
  }): Promise<Post[]> {
    const escapedQuery = this.escapeWildcards(params.query);
    const filters = [
      ilike(schema.posts.text, `%${escapedQuery}%`),
      isNull(schema.posts.replyParentUri),
    ];

    if (params.cursor) {
      const cursor = new Date(params.cursor);
      filters.push(lt(schema.posts.sortAt, cursor));
    }

    const postsWithEmbeds = await this.db.query.posts.findMany({
      where: and(...filters),
      orderBy: [desc(schema.posts.sortAt)],
      limit: params.limit,
      with: {
        embedImages: {
          orderBy: (embedImages, { asc }) => [asc(embedImages.position)],
        },
        embedExternal: true,
        embedRecord: true,
      },
    });

    return postsWithEmbeds.map((post) => this.post(post));
  }
}
