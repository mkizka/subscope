import type { Did } from "@atproto/did";
import type * as AppBskyFeedGetActorLikes from "@repo/client/lex/app/bsky/feed/getActorLikes";

import type { ActorLikesService } from "../../../application/service/feed/actor-likes-service.js";
import type { FeedProcessor } from "../../../application/service/feed/feed-processor.js";

export class GetActorLikesUseCase {
  constructor(
    private readonly actorLikesService: ActorLikesService,
    private readonly feedProcessor: FeedProcessor,
  ) {}

  async execute(params: {
    actorDid: Did;
    limit: number;
    cursor?: Date;
    viewerDid?: Did;
  }): Promise<AppBskyFeedGetActorLikes.$OutputBody> {
    const page = await this.actorLikesService.findLikesWithPagination({
      actorDid: params.actorDid,
      cursor: params.cursor,
      limit: params.limit,
    });

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
