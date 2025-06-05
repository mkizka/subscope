import type { Post, TransactionContext } from "@dawn/common/domain";
import { type PostInsert, schema } from "@dawn/db";
import { inArray } from "drizzle-orm";

import type { IPostRepository } from "../application/interfaces/post-repository.js";

export class PostRepository implements IPostRepository {
  async upsert({ ctx, post }: { ctx: TransactionContext; post: Post }) {
    const data = {
      cid: post.cid,
      actorDid: post.actorDid,
      text: post.text,
      replyRootUri: post.replyRoot?.uri.toString(),
      replyRootCid: post.replyRoot?.cid,
      replyParentUri: post.replyParent?.uri.toString(),
      replyParentCid: post.replyParent?.cid,
      langs: post.langs,
      createdAt: post.createdAt,
    } satisfies PostInsert;
    await ctx.db
      .insert(schema.posts)
      .values({
        uri: post.uri.toString(),
        ...data,
      })
      .onConflictDoUpdate({
        target: schema.posts.uri,
        set: data,
      });
  }

  async existsAny(ctx: TransactionContext, uris: string[]): Promise<boolean> {
    if (uris.length === 0) {
      return false;
    }

    const result = await ctx.db
      .select({ uri: schema.posts.uri })
      .from(schema.posts)
      .where(inArray(schema.posts.uri, uris))
      .limit(1);

    return result.length > 0;
  }
}
