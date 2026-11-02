import type { Did } from "@atproto/did";
import type * as AppBskyFeedGetActorLikes from "@repo/client/lex/app/bsky/feed/getActorLikes";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";
import type { ILikeQuery } from "../../interfaces/queries/like-query.js";
import type { FeedViews } from "../../views/feed-views.js";
import type { ViewContextFactory } from "../../views/view-context.js";

export class GetActorLikesUseCase {
  constructor(
    private readonly likeQuery: ILikeQuery,
    private readonly viewContextFactory: ViewContextFactory,
    private readonly feedViews: FeedViews,
  ) {}

  async execute(params: {
    actorDid: Did;
    limit: number;
    cursor?: Date;
    viewerDid?: Did;
  }): Promise<AppBskyFeedGetActorLikes.$OutputBody> {
    const paginator = createCursorPaginator<FeedItemDto>({
      limit: params.limit,
      getCursor: (item) => item.sortAt.toISOString(),
    });

    const feedItems = await this.likeQuery.findActorLikeFeedItems({
      actorDid: params.actorDid,
      limit: paginator.queryLimit,
      cursor: params.cursor,
    });
    const page = paginator.extractPage(feedItems);

    const ctx = this.viewContextFactory.create({ viewerDid: params.viewerDid });
    const feed = await Promise.all(
      page.items.map((item) => this.feedViews.feedViewPost(item, ctx)),
    );

    return {
      feed: feed.filter((item) => item !== undefined),
      cursor: page.cursor,
    };
  }
}
