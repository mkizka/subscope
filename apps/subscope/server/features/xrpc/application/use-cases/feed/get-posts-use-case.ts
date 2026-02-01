import type { AtUri } from "@atproto/syntax";
import type { $Typed, AppBskyFeedDefs } from "@repo/client/server";

import type { PostViewService } from "../../service/feed/post-view-service.js";

export class GetPostsUseCase {
  constructor(private readonly postViewService: PostViewService) {}
  static inject = ["postViewService"] as const;

  async execute(uris: AtUri[]): Promise<$Typed<AppBskyFeedDefs.PostView>[]> {
    return await this.postViewService.findPostView(uris);
  }
}
