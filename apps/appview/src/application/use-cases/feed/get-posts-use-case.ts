import type { AtUri } from "@atproto/syntax";

import type { PostViewService } from "../../service/feed/post-view-service.js";

export class GetPostsUseCase {
  constructor(private readonly postViewService: PostViewService) {}
  static inject = ["postViewService"] as const;

  async execute(uris: AtUri[]) {
    return await this.postViewService.findPostView(uris);
  }
}
