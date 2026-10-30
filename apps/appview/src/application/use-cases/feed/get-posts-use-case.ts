import type { $Typed } from "@atproto/lex";
import type { AtUri } from "@atproto/syntax";
import type * as AppBskyFeedDefs from "@repo/client/lex/app/bsky/feed/defs";

import type { PostViews } from "../../views/post-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetPostsUseCase {
  constructor(
    private readonly viewContextFactory: ViewContextFactory,
    private readonly postViews: PostViews,
  ) {}

  async execute(uris: AtUri[]): Promise<$Typed<AppBskyFeedDefs.PostView>[]> {
    const ctx = this.viewContextFactory.create();
    const posts = await Promise.all(
      uris.map((uri) => this.postViews.postView(uri.toString(), ctx)),
    );
    return posts.filter((post) => post !== undefined);
  }
}
