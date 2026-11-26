import { AtUri } from "@atproto/syntax";
import type { TransactionContext } from "@repo/common/interface";
import { schema } from "@repo/db";
import { eq } from "drizzle-orm";

import type { IPostQuery } from "../../../application/interfaces/queries/post-query.js";

export class PostQuery implements IPostQuery {
  async findReplyAncestorUris({
    ctx,
    parentUri,
    limit,
  }: {
    ctx: TransactionContext;
    parentUri: AtUri;
    limit: number;
  }): Promise<AtUri[]> {
    const uris = [];
    for (
      let uri: AtUri | null = parentUri;
      uri && uris.length < limit;
      uri = await this.findReplyParentUri(ctx, uri)
    ) {
      uris.push(uri);
    }
    return uris;
  }

  private async findReplyParentUri(ctx: TransactionContext, uri: AtUri) {
    const [post] = await ctx.db
      .select({ replyParentUri: schema.posts.replyParentUri })
      .from(schema.posts)
      .where(eq(schema.posts.uri, uri.toString()))
      .limit(1);
    return post?.replyParentUri ? new AtUri(post.replyParentUri) : null;
  }
}
