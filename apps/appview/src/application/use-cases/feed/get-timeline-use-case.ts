import type { Did } from "@atproto/did";
import type * as AppBskyFeedGetTimeline from "@repo/client/lex/app/bsky/feed/getTimeline";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { ITimelineQuery } from "../../interfaces/queries/timeline-query.js";
import type { FeedViews } from "../../views/feed-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type GetTimelineParams = {
  limit: number;
  viewerDid: Did;
  algorithm?: string;
  cursor?: string;
};

export class GetTimelineUseCase {
  constructor(
    private readonly timelineQuery: ITimelineQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly feedViews: FeedViews,
  ) {}

  async execute({
    limit,
    viewerDid,
    algorithm: _, // TODO: アルゴリズムごとに実装を追加
    cursor,
  }: GetTimelineParams): Promise<AppBskyFeedGetTimeline.$OutputBody> {
    const paginator = createCursorPaginator<FeedItemDto>({
      limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const feedItems = await this.timelineQuery.findFeedItems({
      viewerDid,
      limit: paginator.queryLimit,
      cursor: cursor ? new Date(cursor) : undefined,
    });
    const page = paginator.extractPage(feedItems);

    const ctx = this.viewContextFactory.create({ viewerDid });
    const feed = await Promise.all(
      page.items.map((item) => this.feedViews.feedViewPost(item, ctx)),
    );

    return {
      feed: feed.filter((item) => item !== undefined),
      cursor: page.cursor,
    };
  }
}
