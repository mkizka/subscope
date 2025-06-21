import { AtUri } from "@atproto/syntax";
import type {
  $Typed,
  AppBskyFeedDefs,
  AppBskyFeedGetTimeline,
} from "@repo/client/server";

import { TimelineQuery } from "../domain/models/timeline-query.js";
import type { IPostRepository } from "./interfaces/post-repository.js";
import type { PostViewService } from "./service/post-view-service.js";
import type { ReplyRefService } from "./service/reply-ref-service.js";
import type { TimelineService } from "./service/timeline-service.js";

export class GetTimelineUseCase {
  constructor(
    private readonly timelineService: TimelineService,
    private readonly postRepository: IPostRepository,
    private readonly postViewService: PostViewService,
    private readonly replyRefService: ReplyRefService,
  ) {}
  static inject = [
    "timelineService",
    "postRepository",
    "postViewService",
    "replyRefService",
  ] as const;

  async execute(
    params: AppBskyFeedGetTimeline.QueryParams,
    authDid: string,
  ): Promise<AppBskyFeedGetTimeline.OutputSchema> {
    const query = TimelineQuery.fromCursor({
      authDid,
      cursor: params.cursor,
      limit: params.limit,
    });

    const paginationResult =
      await this.timelineService.findPostsWithPagination(query);

    const postUris = paginationResult.items.map((item) => new AtUri(item.uri));
    const posts = await this.postRepository.findByUris(postUris);

    const [postViews, replyRefMap] = await Promise.all([
      this.postViewService.findPostView(postUris),
      this.replyRefService.createReplyRefs(posts),
    ]);

    const feed: $Typed<AppBskyFeedDefs.FeedViewPost>[] = postViews.map(
      (postView) => ({
        $type: "app.bsky.feed.defs#feedViewPost" as const,
        post: postView,
        reply: replyRefMap.get(postView.uri),
      }),
    );

    const result: AppBskyFeedGetTimeline.OutputSchema = {
      feed,
    };
    if (paginationResult.cursor) {
      result.cursor = paginationResult.cursor;
    }
    return result;
  }
}
