import type { Did } from "@atproto/did";
import type * as AppBskyFeedGetActorLikes from "@repo/client/lex/app/bsky/feed/getActorLikes";

import type { FeedItemDto } from "../../../application/dto/feed-item-dto.js";
import type { ILikeQuery } from "../../../application/interfaces/like-query.js";
import type { FeedProcessor } from "../../../application/service/feed/feed-processor.js";
import { createCursorPaginator } from "../../../application/utils/pagination.js";

export class GetActorLikesUseCase {
  constructor(
    private readonly likeQuery: ILikeQuery,
    private readonly feedProcessor: FeedProcessor,
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

    const feed = await this.feedProcessor.processFeedItems(
      page.items,
      params.viewerDid,
    );

    return {
      feed,
      cursor: page.cursor,
    };
  }
}
