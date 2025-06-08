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

export class PostRepository implements IPostRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

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

    return postsWithImages.map((post) => {
      const images = post.embedImages.map(
        (image) => new PostEmbedImage(image.cid, image.position, image.alt),
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
    });
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

    return postsWithImages.map((post) => {
      const images = post.embedImages.map(
        (image) => new PostEmbedImage(image.cid, image.position, image.alt),
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
    });
  }
}
