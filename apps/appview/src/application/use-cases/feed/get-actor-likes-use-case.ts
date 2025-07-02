import type { Did } from "@atproto/did";
import type { AppBskyFeedGetActorLikes } from "@repo/client/server";
import type { DatabaseClient } from "@repo/common/domain";

import type { ActorLikesService } from "../../service/feed/actor-likes-service.js";
import type { FeedProcessor } from "../../service/feed/feed-processor.js";

export class GetActorLikesUseCase {
  constructor(
    private readonly db: DatabaseClient,
    private readonly actorLikesService: ActorLikesService,
    private readonly feedProcessor: FeedProcessor,
  ) {}
  static inject = ["db", "actorLikesService", "feedProcessor"] as const;

  async execute(params: {
    actorDid: Did;
    limit: number;
    cursor?: Date;
  }): Promise<AppBskyFeedGetActorLikes.OutputSchema> {
    const paginationResult =
      await this.actorLikesService.findLikesWithPagination({
        actorDid: params.actorDid,
        cursor: params.cursor,
        limit: params.limit,
      });

    return await this.feedProcessor.processFeedItems(paginationResult);
  }
}
