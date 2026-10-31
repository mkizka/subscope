import type { $Typed } from "@atproto/lex";
import { toDatetimeString } from "@atproto/syntax";
import type * as AppBskyFeedDefs from "@repo/client/lex/app/bsky/feed/defs";

import { asLexMap } from "../utils/lex.js";
import type { EmbedViews } from "./embed-views.js";
import type { ProfileViews } from "./profile-views.js";
import type { ViewContext } from "./view-context.js";

export class PostViews {
  constructor(
    private readonly profileViews: ProfileViews,
    private readonly embedViews: EmbedViews,
  ) {}

  async postView(
    uri: string,
    ctx: ViewContext,
  ): Promise<$Typed<AppBskyFeedDefs.PostView> | undefined> {
    const post = await ctx.post(uri);
    if (!post) {
      return undefined;
    }
    const [record, author, stats, viewer, embed] = await Promise.all([
      ctx.record(uri),
      this.profileViews.basic(post.actorDid, ctx),
      ctx.stats(uri),
      ctx.viewerPostState(uri),
      this.embedViews.embedView(post, ctx),
    ]);
    if (!record || !author) {
      return undefined;
    }
    return {
      $type: "app.bsky.feed.defs#postView",
      uri: post.uri,
      cid: record.cid,
      author,
      record: asLexMap(record.json),
      embed,
      replyCount: stats?.replyCount ?? 0,
      repostCount: stats?.repostCount ?? 0,
      likeCount: stats?.likeCount ?? 0,
      quoteCount: stats?.quoteCount ?? 0,
      viewer: {
        repost: viewer.repost?.uri,
        like: viewer.like?.uri,
      },
      indexedAt: toDatetimeString(post.indexedAt),
    };
  }
}
