import type { AppBskyFeedGetLikes } from "@repo/client/server";

import type { ProfileViewService } from "@/server/features/xrpc/application/service/actor/profile-view-service.js";
import type { LikeService } from "@/server/features/xrpc/application/service/graph/like-service.js";
import { toMapByDid } from "@/server/features/xrpc/application/utils/map.js";

export class GetLikesUseCase {
  constructor(
    private readonly likeService: LikeService,
    private readonly profileViewService: ProfileViewService,
  ) {}
  static inject = ["likeService", "profileViewService"] as const;

  async execute(
    params: AppBskyFeedGetLikes.QueryParams,
  ): Promise<AppBskyFeedGetLikes.OutputSchema> {
    const cursor = params.cursor ? new Date(params.cursor) : undefined;

    const paginationResult = await this.likeService.findLikesWithPagination({
      subjectUri: params.uri,
      cursor,
      limit: params.limit,
    });

    const actorDids = paginationResult.items.map((like) => like.actorDid);
    const profileViewMap = await this.profileViewService
      .findProfileView(actorDids)
      .then(toMapByDid);

    const likes: AppBskyFeedGetLikes.Like[] = paginationResult.items.map(
      (like) => {
        const profileView = profileViewMap.get(like.actorDid);
        if (!profileView) {
          throw new Error(`Profile not found for actor: ${like.actorDid}`);
        }
        return {
          $type: "app.bsky.feed.getLikes#like",
          indexedAt: like.sortAt.toISOString(), // TODO: indexedAtに修正
          createdAt: like.createdAt.toISOString(),
          actor: profileView,
        };
      },
    );

    return {
      uri: params.uri,
      cid: params.cid,
      cursor: paginationResult.cursor,
      likes,
    };
  }
}
