import { AtUri } from "@atproto/syntax";
import type { AppBskyFeedGetTimeline } from "@repo/client/server";

import { TimelineQuery } from "./domain/timeline-query.js";
import type { PostViewService } from "./service/post-view-service.js";
import type { TimelineService } from "./service/timeline-service.js";

export class GetTimelineUseCase {
  constructor(
    private readonly timelineService: TimelineService,
    private readonly postViewService: PostViewService,
  ) {}
  static inject = ["timelineService", "postViewService"] as const;

  async execute(
    params: AppBskyFeedGetTimeline.QueryParams,
    authDid: string,
  ): Promise<AppBskyFeedGetTimeline.OutputSchema> {
    const query = TimelineQuery.fromCursor({
      authDid,
      cursor: params.cursor,
      limit: params.limit,
    });

    const paginationResult = await this.timelineService.findPostsWithPagination(query);

    const postViews = await this.postViewService.findPostView(
      paginationResult.items.map((post) => new AtUri(post.uri)),
    );

    const feed = postViews.map((postView) => ({
      $type: "app.bsky.feed.defs#feedViewPost" as const,
      post: postView,
    }));

    const result: AppBskyFeedGetTimeline.OutputSchema = {
      feed,
    };
    if (paginationResult.cursor) {
      result.cursor = paginationResult.cursor;
    }
    return result;
  }
}
