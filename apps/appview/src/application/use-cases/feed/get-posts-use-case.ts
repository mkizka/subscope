import type { $Typed } from "@atproto/lex";
import type { AtUri } from "@atproto/syntax";
import type * as AppBskyFeedDefs from "@repo/client/lex/app/bsky/feed/defs";

import type { PostViewService } from "../../../application/service/feed/post-view-service.js";

export class GetPostsUseCase {
  constructor(private readonly postViewService: PostViewService) {}

  async execute(uris: AtUri[]): Promise<$Typed<AppBskyFeedDefs.PostView>[]> {
    return await this.postViewService.findPostView(uris);
  }
}
