import type { Did } from "@atproto/did";
import type * as MeSubscoServerGetLocalTimeline from "@repo/client/me/subsco/server/getLocalTimeline";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { ITimelineQuery } from "../../interfaces/queries/timeline-query.js";
import type { FeedViews } from "../../views/feed-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

type GetLocalTimelineParams = {
  limit: number;
  cursor?: string;
  viewerDid?: Did;
};

export class GetLocalTimelineUseCase {
  constructor(
    private readonly deps: {
      timelineQuery: ITimelineQuery;
      viewContextFactory: ViewContextFactory;
      feedViews: FeedViews;
    },
  ) {}

  async execute({
    limit,
    cursor,
    viewerDid,
  }: GetLocalTimelineParams): Promise<MeSubscoServerGetLocalTimeline.$OutputBody> {
    const paginator = createCursorPaginator<FeedItemDto>({
      limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const feedItems = await this.deps.timelineQuery.findLocalFeedItems({
      limit: paginator.queryLimit,
      cursor: cursor ? new Date(cursor) : undefined,
    });
    const page = paginator.extractPage(feedItems);

    const ctx = this.deps.viewContextFactory.create({ viewerDid });
    const feed = await Promise.all(
      page.items.map((item) => this.deps.feedViews.feedViewPost(item, ctx)),
    );

    return {
      feed: feed.filter((item) => item !== undefined),
      cursor: page.cursor,
    };
  }
}
