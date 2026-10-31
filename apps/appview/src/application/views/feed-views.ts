import type { $Typed } from "@atproto/lex";
import { asAtUriString, toDatetimeString } from "@atproto/syntax";
import type * as AppBskyFeedDefs from "@repo/client/lex/app/bsky/feed/defs";

import type { FeedItemDto } from "../dto/feed-item-dto.js";
import type { PostViews } from "./post-views.js";
import type { ProfileViews } from "./profile-views.js";
import type { ViewContext } from "./view-context.js";

export class FeedViews {
  constructor(
    private readonly postViews: PostViews,
    private readonly profileViews: ProfileViews,
  ) {}

  async feedViewPost(
    item: FeedItemDto,
    ctx: ViewContext,
  ): Promise<$Typed<AppBskyFeedDefs.FeedViewPost> | undefined> {
    const postUri = item.type === "post" ? item.uri : item.subjectUri;
    if (!postUri) {
      return undefined;
    }
    const [post, reply, reason] = await Promise.all([
      this.postViews.postView(postUri, ctx),
      this.replyRef(postUri, ctx),
      item.type === "repost" ? this.reasonRepost(item, ctx) : undefined,
    ]);
    if (!post) {
      return undefined;
    }
    return {
      $type: "app.bsky.feed.defs#feedViewPost",
      post,
      reply,
      reason,
    };
  }

  private async replyRef(
    uri: string,
    ctx: ViewContext,
  ): Promise<$Typed<AppBskyFeedDefs.ReplyRef> | undefined> {
    const post = await ctx.post(uri);
    if (!post?.replyRootUri || !post.replyParentUri) {
      return undefined;
    }
    const [root, parent] = await Promise.all([
      this.postOrNotFound(post.replyRootUri, ctx),
      this.postOrNotFound(post.replyParentUri, ctx),
    ]);
    return { $type: "app.bsky.feed.defs#replyRef", root, parent };
  }

  private async postOrNotFound(
    uri: string,
    ctx: ViewContext,
  ): Promise<
    $Typed<AppBskyFeedDefs.PostView> | $Typed<AppBskyFeedDefs.NotFoundPost>
  > {
    return (
      (await this.postViews.postView(uri, ctx)) ?? {
        $type: "app.bsky.feed.defs#notFoundPost",
        uri: asAtUriString(uri),
        notFound: true,
      }
    );
  }

  private async reasonRepost(
    item: FeedItemDto,
    ctx: ViewContext,
  ): Promise<$Typed<AppBskyFeedDefs.ReasonRepost> | undefined> {
    const [repost, by] = await Promise.all([
      ctx.repost(item.uri),
      this.profileViews.basic(item.actorDid, ctx),
    ]);
    if (!repost || !by) {
      return undefined;
    }
    return {
      $type: "app.bsky.feed.defs#reasonRepost",
      by,
      indexedAt: toDatetimeString(repost.indexedAt),
    };
  }
}
