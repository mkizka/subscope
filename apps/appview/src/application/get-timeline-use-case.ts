import { AtUri } from "@atproto/syntax";
import type { AppBskyFeedGetTimeline } from "@dawn/client";
import type { DatabaseClient } from "@dawn/common/domain";

import type { PostViewService } from "./service/post-view-service.js";

export class GetTimelineUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly postViewService: PostViewService,
  ) {}
  static inject = ["db", "postViewService"] as const;

  async execute(
    params: AppBskyFeedGetTimeline.QueryParams,
  ): Promise<AppBskyFeedGetTimeline.OutputSchema> {
    const samplePosts = await this.db.query.posts.findMany({
      limit: params.limit,
    });
    const posts = await this.postViewService.findPostView(
      samplePosts.map((post) => new AtUri(post.uri)),
    );
    return {
      cursor: undefined, // TODO: 実装
      feed: posts.map((post) => ({ post })),
    };
  }
}
