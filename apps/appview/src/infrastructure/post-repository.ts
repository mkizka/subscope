import { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@dawn/common/domain";
import { Post, PostEmbedImage } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { and, inArray, lt } from "drizzle-orm";

import type { IPostRepository } from "../application/interfaces/post-repository.js";

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

type SelectPost = typeof schema.posts.$inferSelect & {
  embedImages: SelectPostEmbedImage[];
};

export class PostRepository implements IPostRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  private convertToPostEmbedImage(image: SelectPostEmbedImage) {
    const aspectRatio =
      image.aspectRatioWidth && image.aspectRatioHeight
        ? {
            width: image.aspectRatioWidth,
            height: image.aspectRatioHeight,
          }
        : undefined;
    return new PostEmbedImage({
      cid: image.cid,
      position: image.position,
      alt: image.alt,
      aspectRatio,
    });
  }

  private convertToPost(post: SelectPost) {
    const images = post.embedImages.map((image) =>
      this.convertToPostEmbedImage(image),
    );
    return new Post({
      uri: post.uri,
      cid: post.cid,
      actorDid: post.actorDid,
      text: post.text,
      replyRoot: getStrongRef(post.replyRootUri, post.replyRootCid),
      replyParent: getStrongRef(post.replyParentUri, post.replyParentCid),
      langs: post.langs,
      embed: images.length > 0 ? images : null,
      createdAt: post.createdAt,
      sortAt: post.sortAt,
    });
  }

  async findByUris(uris: AtUri[]) {
    const postsWithImages = await this.db.query.posts.findMany({
      where: inArray(
        schema.posts.uri,
        uris.map((uri) => uri.toString()),
      ),
      with: {
        embedImages: {
          orderBy: (embedImages, { asc }) => [asc(embedImages.position)],
        },
      },
    });
    return postsWithImages.map((post) => this.convertToPost(post));
  }

  async findMany(params: { limit: number; cursor?: string }) {
    const filters = [];
    if (params.cursor) {
      const cursor = new Date(params.cursor);
      filters.push(lt(schema.posts.sortAt, cursor));
    }

    const postsWithImages = await this.db.query.posts.findMany({
      where: and(...filters),
      orderBy: (posts, { desc }) => [desc(posts.sortAt)],
      limit: params.limit,
      with: {
        embedImages: {
          orderBy: (embedImages, { asc }) => [asc(embedImages.position)],
        },
      },
    });
    return postsWithImages.map((post) => this.convertToPost(post));
  }
}
