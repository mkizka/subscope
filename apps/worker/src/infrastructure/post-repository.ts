import type { Post, TransactionContext } from "@dawn/common/domain";
import { schema } from "@dawn/db";

import type { IPostRepository } from "../application/interfaces/post-repository.js";

export class PostRepository implements IPostRepository {
  async upsert({ ctx, post }: { ctx: TransactionContext; post: Post }) {
    await ctx.db
      .insert(schema.posts)
      .values({
        uri: post.uri.toString(),
        cid: post.cid,
        actorDid: post.actorDid,
        text: post.text,
        langs: post.langs,
        createdAt: post.createdAt,
      })
      .onDuplicateKeyUpdate({
        set: {
          text: post.text,
          langs: post.langs,
          createdAt: post.createdAt,
        },
      });
  }
}
