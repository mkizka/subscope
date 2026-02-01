import type { Did } from "@atproto/did";
import type { AppBskyFeedGetActorLikes } from "@repo/client/server";

import type { ActorLikesService } from "@/server/features/xrpc/application/service/feed/actor-likes-service.js";
import type { FeedProcessor } from "@/server/features/xrpc/application/service/feed/feed-processor.js";

export class GetActorLikesUseCase {
  constructor(
    private readonly actorLikesService: ActorLikesService,
    private readonly feedProcessor: FeedProcessor,
  ) {}
  static inject = ["actorLikesService", "feedProcessor"] as const;

  async execute(params: {
    actorDid: Did;
    limit: number;
    cursor?: Date;
    viewerDid?: Did;
  }): Promise<AppBskyFeedGetActorLikes.OutputSchema> {
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
