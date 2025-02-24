import { AtUri } from "@atproto/syntax";
import type { DatabaseClient } from "@dawn/common/domain";
import { Post } from "@dawn/common/domain";
import { schema } from "@dawn/db";
import { and, desc, lt } from "drizzle-orm";

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

  async findMany(params: { limit: number; cursor?: string }) {
    const filters = [];
    if (params.cursor) {
      const cursor = new Date(params.cursor);
      filters.push(lt(schema.posts.sortAt, cursor));
    }
    const posts = await this.db
      .select()
      .from(schema.posts)
      .where(and(...filters))
      .orderBy(desc(schema.posts.sortAt))
      .limit(params.limit);
    return posts.map(
      (post) =>
        new Post({
          uri: post.uri,
          cid: post.cid,
          actorDid: post.actorDid,
          text: post.text,
          replyRoot: getStrongRef(post.replyRootUri, post.replyRootCid),
          replyParent: getStrongRef(post.replyParentUri, post.replyParentCid),
          langs: post.langs,
          createdAt: post.createdAt,
          sortAt: post.sortAt,
        }),
    );
  }
}
