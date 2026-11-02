import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IPostQuery } from "../../../application/interfaces/queries/post-query.js";

export class PostQuery implements IPostQuery {
  async exists(ctx: TransactionContext, uri: AtUri): Promise<boolean> {
    const result = await ctx.db
      .select({ uri: schema.posts.uri })
      .from(schema.posts)
      .where(eq(schema.posts.uri, uri.toString()))
      .limit(1);

    return result.length > 0;
  }

  async findReplyParentUri(
    ctx: TransactionContext,
    uri: AtUri,
  ): Promise<AtUri | null> {
    const [post] = await ctx.db
      .select({ replyParentUri: schema.posts.replyParentUri })
      .from(schema.posts)
      .where(eq(schema.posts.uri, uri.toString()))
      .limit(1);
    return post?.replyParentUri ? new AtUri(post.replyParentUri) : null;
  }
}
